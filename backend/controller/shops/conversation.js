const Conversation = require("../../model/shops/conversation");
const asynchandler = require("express-async-handler");
const SHOPS = require("../../model/shops/shop");
const logger = require("../../utils/logger");
const USER = require("../../model/users/user.js");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;


const clearOldMessages = asynchandler(async () => {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    await Conversation.deleteMany({
      "messages.timestamp": { $lt: fortyEightHoursAgo },
    });
    console.log("Old messages deleted successfully");
  } catch (error) {
    console.error("Error deleting old messages:", error);
    throw error;
  }
});


const sendMessage = asynchandler(async (req, res) => {
  try {
    await clearOldMessages();
    const { message } = req.body;
    const { firstId } = req.auth;
    const { secondId } = req.params;
    const user_one = await USER.findById(firstId);
    const user_two = await USER.findById(secoondId);

    if (user_one && user_two) {
      throw Object.assign(new Error("not authorized"), { statusCode: 404 });
    }
    const newMessage = {
      sender: userId,
      message,
    };
    let conversation = await Conversation.create({firstId, secondId, message});
    if (conversaation) {
      res.status(200).json({conversation});
    }       
  } catch (error) {
    console.error("Error sending message:", error);
    throw Object.assign(new Error(`${error.message}`),{statusCode:error.statusCode})
  }
});

// Retrieve messages in a conversation
const getMessages = asynchandler(async (req, res) => {
  try {
    await clearOldMessages();
    const {firstId}=req.auth
    const {secondId}= req.params
    const user_one = await User.findById(firstId)
    const user_two = await User.findById(secondId)
    if(user_one && user_two){
      throw Object.assign(new Error('not authorized'),{statusCode:403})
    }
    const messages = await Conversation.findOne({firstId:firstId,secondId:secondId})
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).send("Internal server error");
  }
});

module.exports = {
  sendMessage,
  getMessages,
};
