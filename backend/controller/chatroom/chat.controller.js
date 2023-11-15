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
      throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    }
    const chatCreate = await CHAT.create({
      chat,
      chat_owner: name._id,
      userName: name.userName,
    });
    if (!chatCreate) {
      throw Object.assign(new Error("Error sending your message"), { statusCode: 500});;
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
    if (!id) throw Object.assign(new Error("Not a user"), { statusCode: 404 });;
    const name = await users.findById(id); // Assuming
    if (!name.banned_from_forum) {
      throw Object.assign(new Error("Banned from forum"), { statusCode: 403 });
;
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
    throw Object.assign(new Error("Banned from forum"), { statusCode: 403 });
;
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
      throw Object.assign(new Error("not authorized"), { statusCode: 403 });
; // Assuming
    const deletedChat = await CHAT.findByIdAndDelete(chatId);
    if (!deletedChat) {
      throw Object.assign(new Error("chat not found"), { statusCode: 500 });
;
    }
    res.status(200).json({
      successful: true,
    });
    logger.info(
      `Chat with id ${chatId} has been deleted by admin ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: 403 });
;
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
