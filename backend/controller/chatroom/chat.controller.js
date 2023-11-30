const asynchandler = require("express-async-handler");
const CHAT = require("../../model/chat/chat");
const thread = require("../../model/chat/thread");
const users = require("../../model/users/user");
const jwt = require("jsonwebtoken");


/**
 * @api {post} /send-message Create Chat Message
 * @apiName CreateChatMessage
 * @apiGroup Chat
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} chat Chat message.
 *
 * @apiSuccess {Boolean} successful Indicates whether the message was successfully sent.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "successful": true,
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (404) NotAUser The user was not found.
 * @apiError (500) ErrorSendingMessage An error occurred while sending the message.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "NotAUser"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "ErrorSendingMessage"
 *     }
 */
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

const threads = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const {  content } = req.body;
    const {chatId } =req.params
    if (!id) throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    if (!content)  throw Object.assign(new Error("Body cannot be empty"), {
      statusCode: 400,
    });
    const user = await USER.findById(id);
    const blog = await thread.create({
      chatId,
      owner_id: id,
      owner_name: user.userName,
      content,
    });
    const chats = await CHAT.findById(blog_id);
    const threads = await thread.find({ chatId: chatId });
    const threadCount = threads.length;
    const token = generateToken(id);
    res
      .status(200)
      .header("Authorization", `Bearer ${token}`)
      .json({ chats, threads, threadCount });
    logger.info(
      `User with id ${id} created a commen with id: ${blog._id} at ${blog.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});
/**
 * @api {get} /getall Get All Chats
 * @apiName GetAllChats
 * @apiGroup Chat
 *
 * @apiHeader {String} Authorization User's authorization token.
 *
 * @apiSuccess {Boolean} successful Indicates whether the request was successful.
 * @apiSuccess {Array} data Array of chat objects.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "successful": true,
 *       "data": [
 *         {
 *           "_id": "chatId",
 *           "chat": "chatMessage",
 *           // other chat fields
 *         },
 *         // more chat objects
 *       ],
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (403) BannedFromForum The user is banned from the forum.
 * @apiError (404) NotAUser The user was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "error": "BannedFromForum"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "NotAUser"
 *     }
 */
const getallchats = asynchandler(async (req, res, io) => {
  try {
    const { id } = req.auth;
    if (!id) throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    const name = await users.findById(id); // Assuming
    if (name.banned_from_forum) {
      throw Object.assign(new Error("Banned from forum"), { statusCode: 403 });
    }
    const allChats = await CHAT.find().sort({ createdAt: -1 });
    const chatsWithThreadCount = await Promise.all(allChats.map(async (chat) => {
      const threads = await thread.find({ chatId: chat._id });
      return {
        ...chat._doc,
        threadCount: threads.length,
      };
    }));
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: chatsWithThreadCount,
    });
    logger.info(
      `chats fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} `
    );
  } catch (error) {
    throw Object.assign(new Error("Banned from forum"), { statusCode: 403 });
  }
});
const getOneChat = asynchandler(async (req, res, io) => {
  try {
    const { id } = req.auth;
    const { chatId } = req.params;
    if (!id) throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    const name = await users.findById(id); // Assuming
    if (name.banned_from_forum) {
      throw Object.assign(new Error("Banned from forum"), { statusCode: 403 });
    }
    const chat = await CHAT.findById(chatId);
    if (!chat) {
      throw Object.assign(new Error("Chat not found"), { statusCode: 404 });
    }
    const threads = await thread.find({ chatId: chat._id });
    const threadCount = threads.length;
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: {
        ...chat._doc,
        threadCount,
        threads,
      },
    });
    logger.info(
      `chat fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} `
    );
  } catch (error) {
    throw Object.assign(new Error("Banned from forum"), { statusCode: 403 });
  }
});


/**
 * @api {delete} /delete/:chatId Delete Chat Message
 * @apiName DeleteChatMessage
 * @apiGroup Chat
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} chatId ID of the chat message to delete.
 *
 * @apiSuccess {Boolean} successful Indicates whether the deletion was successful.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "successful": true
 *     }
 *
 * @apiError (403) NotAuthorized The user is not authorized to delete this data.
 * @apiError (404) NotAUser The user was not found.
 * @apiError (500) ChatNotFound The chat message was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "error": "NotAuthorized"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "NotAUser"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "ChatNotFound"
 *     }
 */
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
module.exports = { chatlogic,getOneChat, threads,getallchats, deletechat };
