const asynchandler = require("express-async-handler");
const CHAT = require("../../model/chat/chat");
const users = require("../../model/users/user");
const jwt = require("jsonwebtoken");
const chatlogic = asynchandler(async (req, res, io) => {
  try {
    const { id } = req.auth;
    const { chat } = req.body;
    const name = await users.findById(id); // Assuming
    if (!name.banned_from_forum) {
      ("you have been banned from this forum");
    }
    const chatCreate = await CHAT.create({
      chat,
      chat_owner: name._id,
      userName: name.userName,
    });
    if (!chatCreate) {
      throw new Error("error sending your message");
    }
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      successful: true,
    });
    logger.info(
      `user with id ${id},send a message ${chatCreate._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip} `
    );
  } catch (error) {
    throw new Error(`${error}`);
  }
});
const getallchats = asynchandler(async (req, res, io) => {
  try {
    const { id } = req.auth;
    if (!id) throw new error("not a user");
    const name = await users.findById(id); // Assuming
    if (!name.banned_from_forum) {
      ("you have been banned from this forum");
    }
    const allChats = await CHAT.find().sort({ createdAt: -1 });
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      successful: true,
      data: allChats,
    });
    logger.info(
      `chats fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} `
    );
  } catch (error) {
    throw new Error(`${error}`);
  }
});
const deletechat = asynchandler(async (req, res, io) => {
  try {
    const { id } = req.auth;
    const { chatId } = req.params;

    if (!id) throw new error("not a user");
    const name = await users.findById(id);
    if (
      !(
        name.role === "superadmin" ||
        process.env.role.toString() === "superadmin"
      )
    )
      throw new Error("not authorized"); // Assuming
    const deletedChat = await CHAT.findByIdAndDelete(chatId);
    if (!deletedChat) {
      throw new Error("Chat not found");
    }
    res.status(200).json({
      successful: true,
    });
    logger.info(
      `Chat with id ${chatId} has been deleted by admin ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw new Error(`${error}`);
  }
});
const generateToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
};
module.exports = { chatlogic, getallchats, deletechat };
