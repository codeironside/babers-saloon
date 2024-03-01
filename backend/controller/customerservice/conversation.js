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
    console.error(
      "Error deleting old messages and empty conversations:",
      error
    );
    throw error;
  }
});

const sendMessage = asynchandler(async (req, res) => {
  try {
    await clearOldMessages();
    const { message } = req.body;
    const { id: senderId } = req.auth;
    const { firstid: receiverId } = req.params;

    const sender = await USER.findById(senderId);
    const receiver = await USER.findById(receiverId);

    if (!sender || !receiver) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 404 });
    }

    // Find conversation where both senderId and receiverId match in either order
    let conversation = await Conversation.findOne({
      $or: [
        { user_one: senderId, user_two: receiverId },
        { user_one: receiverId, user_two: senderId },
      ],
    });

    const newMessage = { sender: senderId, message };

    if (conversation) {
      conversation.messages.push(newMessage);
    } else {
      conversation = await Conversation.create({
        user_one: senderId,
        user_two: receiverId,
        messages: [newMessage],
      });
    }

    await conversation.save();

    // Populate user_one, user_two, and messages.sender before sending the conversation back
    conversation = await Conversation.findById(conversation._id)
      .populate("user_one")
      .populate("user_two")
      .populate("messages.sender");

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
    const { firstid } = req.params;

    const user_one = await USER.findById(firstid);
    const user_two = await USER.findById(id);

    if (!user_one || !user_two) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }

    // Find messages where both firstId and secondId match in either order
    let conversation = await Conversation.findOne({
      $or: [
        { user_one: id, user_two: firstid },
        { user_one: firstid, user_two: id },
      ],
    });

    if (!conversation) {
      throw Object.assign(new Error("No messages for these users"), {
        statusCode: 404,
      });
    }

    // Populate all ID fields in the schema
    // Populate user_one, user_two, and messages.sender before sending the conversation back
    conversation = await Conversation.findById(conversation._id)
      .populate("user_one")
      .populate("user_two")
      .populate("messages.sender");

    res.status(200).json({ messages: conversation });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    throw Object.assign(new Error(`${error.message}`), {
      statusCode: error.statusCode,
    });
  }
});
const getAllMessagesForUser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;

    // Find all conversations where the user is either user_one or user_two
    let conversations = await Conversation.find({
      $or: [
        { user_one: id },
        { user_two: id },
      ],
    })
    .populate("user_one")
    .populate("user_two")
    .populate("messages.sender");

    if (!conversations) {
      throw Object.assign(new Error("No messages for this user"), {
        statusCode: 404,
      });
    }

    res.status(200).json({ messages: conversations });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    throw Object.assign(new Error(`${error.message}`), {
      statusCode: error.statusCode,
    });
  }
});


// Retrieve messages in a conversation

module.exports = {
  sendMessage,
  getMessages,
  getAllMessagesForUser
};
