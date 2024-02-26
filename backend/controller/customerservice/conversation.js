const Conversation = require("../../model/customerservice/conversation.js");
const asynchandler = require("express-async-handler");
const SHOPS = require("../../model/shops/shop.js");
const logger = require("../../utils/logger.js");
const USER = require("../../model/users/user.js");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

// const clearOldMessages = asynchandler(async () => {
//   try {
//     const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
//     await Conversation.deleteMany({
//       "messages.timestamp": { $lt: fortyEightHoursAgo },
//     });
//     console.log("Old messages deleted successfully");
//   } catch (error) {
//     console.error("Error deleting old messages:", error);
//     throw error;
//   }
// });
const clearOldMessages = asynchandler(async () => {
  try {
    const fifteenHoursAgo = new Date(Date.now() - 15 * 60 * 60 * 1000);

    // Remove old messages from conversations
    await Conversation.updateMany(
      {},
      { $pull: { messages: { createdAt: { $lt: fifteenHoursAgo } } } },
      { multi: true }
    );

    // Delete conversations that have no messages left
    await Conversation.deleteMany({ messages: { $size: 0 } });

    console.log("Old messages and empty conversations deleted successfully");
  } catch (error) {
    console.error("Error deleting old messages and empty conversations:", error);
    throw error;
  }
});


const sendMessage = asynchandler(async (req, res) => {
  try {
    await clearOldMessages();
    const { message } = req.body;
    const { id } = req.auth;
    const { firstid} = req.params;

    const user_one = await USER.findById(id);
    const user_two = await USER.findById(firstid);

    if (!user_one || !user_two) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 404 });
    }

    // Find conversation where both firstId and secondId match in either order
    let conversation = await Conversation.findOne({
      $or: [
        { user_one: firstid, user_two: id },
        { user_one: id, user_two: firstid },
      ],
    });

    if (conversation) {
      conversation.messages.push({ message });
    } else {
      conversation = await Conversation.create({
        user_one: firstid,
        user_two: id,
        messages: [{ message }],
      });
      
    }

    await conversation.save();

    res.status(200).json({ conversation });
  } catch (error) {
    console.error("Error sending message:", error);
    throw Object.assign(new Error(`${error.message}`), {
      statusCode: error.statusCode,
    });
  }
});

const getMessages = asynchandler(async (req, res) => {
  try {
    await clearOldMessages();
    const { id } = req.auth;
    const { firstid} = req.params;

    const user_one = await USER.findById(firstid);
    const user_two = await USER.findById(id);

    if (!user_one || !user_two) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }

    // Find messages where both firstId and secondId match in either order
    const messages = await Conversation.findOne({
      $or: [
        { user_one: id, user_two: firstid },
        { user_one: firstid, user_two: id },
      ],
    });

    if (!messages) {
      throw Object.assign(new Error("No messages for these users"), {
        statusCode: 404,
      });
    }

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    throw Object.assign(new Error(`${error.message}`), {
      statusCode: error.statusCode,
    });
  }
})
// Retrieve messages in a conversation

module.exports = {
  sendMessage,
  getMessages,
};
