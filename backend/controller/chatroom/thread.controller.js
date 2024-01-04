const asynchandler = require("express-async-handler");
const THREAD = require("../../model/chat/chat");
const comment = require("../../model/chat/thread");
const users = require("../../model/users/user");
const jwt = require("jsonwebtoken");
const logger = require("../../utils/logger");


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
const threadlogic = asynchandler(async (req, res, io) => {
  try {
    const { id } = req.auth;
    const { thread,topic,category } = req.body;
    const name = await users.findById(id); 
    if (name.banned_from_forum) {
      throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    }
    const threadCreate = await THREAD.create({
      thread,
      topic,
      category,
      thread_owner: name._id,
      userName: name.userName,
      image:name.pictureUrl
    });
    if (!threadCreate) {
      throw Object.assign(new Error("Error sending your message"), { statusCode: 500});;
    }
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      threadCreate
    });
    logger.info(
      `user with id ${id},create a threead ${threadCreate._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip} `
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const comments = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const {  content } = req.body;
    const {threadId } =req.params
    if (!id) throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    if (!content)  throw Object.assign(new Error("Body cannot be empty"), {
      statusCode: 400,
    });
    const user = await users.findById(id);
    const thread = await comment.create({
      threadId,
      owner_id: id,
      userName: user.userName,
      image:user.pictureUrl,
      content,
    });
    // const chats = await CHAT.findById(blog_id);
    // const threads = await thread.find({ chatId: chatId });
    // const threadCount = threads.length;
    const token = generateToken(id);
    res
      .status(200)
      .header("Authorization", `Bearer ${token}`)
      .json({ thread});
    logger.info(
      `User with id ${id} created a commen with id: ${thread._id} at ${blog.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
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
const getallthread = asynchandler(async (req, res, io) => {
  try {
    const { id } = req.auth;
    if (!id) throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    const name = await users.findById(id); // Assuming
    if (name.banned_from_forum) {
      throw Object.assign(new Error("Banned from forum"), { statusCode: 403 });
    }
    const allthreads = await THREAD.find().sort({ createdAt: -1 });
    const chatsWithThreadCount = await Promise.all(allthreads.map(async (chat) => {
      const threads = await comment.find({ threadId: chat._id });
      const comments = await Promise.all(threads.map(async (thread) => {
        const images = thread.image;
        const commentWithImages = {
          ...thread._doc,
          images,
        };
        return commentWithImages;
      }));
      return {
        ...chat._doc,
        threadCount: threads.length,
        comments,
      };
    }));
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      chatsWithThreadCount,
    });
    logger.info(
      `chats fetched by ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode:error.statusCode });
  }
});



const getOnethread = asynchandler(async (req, res, io) => {
  try {
    const { id } = req.auth;
    const { query } = req.params;
    if (!id) throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    const name = await users.findById(id); // Assuming
    if (name.banned_from_forum) {
      throw Object.assign(new Error("Banned from forum"), { statusCode: 403 });
    }
    const chats = await CHAT.find({ chat: { $regex: query } });;
    if (!chats) {
      throw Object.assign(new Error("No chats found"), { statusCode: 404 });
    }
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: chats,
    });
    logger.info(
      `chats fetched by ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} `
    );
  } catch (error) {
    throw Object.assign(new Error("Banned from forum"), { statusCode:error.statusCode });
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
const deletethread = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { threadId } = req.params;

    if (!id) throw new error("not a user");
    const name = await users.findById(id);
    if (
      
        name.role !== "superadmin"
      )
    
      throw Object.assign(new Error("not authorized"), { statusCode: 403 });
; // Assuming
    const deletedChat = await THREAD.findByIdAndDelete(threadId);
    if (!deletedChat) {
      throw Object.assign(new Error("chat not found"), { statusCode: 500 });
;
    }
    res.status(200).json({
      successful: true,
    });
    logger.info(
      `Chat with id ${threadId} has been deleted by admin ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode});
;
  }
});








const getThreadWithComments =asynchandler( async (req, res) => {
  try {
    const { threadId } = req.params;
    const {id}= req.auth
    const thread = await THREAD.findById(threadId);
    if (!thread) {
      throw Object.assign(new Error("Thread not found"), { statusCode: 404 });
    }
    const comments = await comment.find({ threadId });
    const commentsWithImages = await Promise.all(comments.map(async (comment) => {
      const images = comment.image;
      const commentWithImages = {
        ...comment._doc,
        images,
      };
      return commentWithImages;
    }));
    res.status(200).json({
      thread,
      comments: commentsWithImages,
    });
    logger.info(
      `user with id ${id} fetched thread with id: ${threadId} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode:error.statusCode });
  }
})

const updateThread =asynchandler( async (req, res) => {
  try {
    const { threadId } = req.params;
    const {id}=req.auth
    const threads = await THREAD.findById(threadId);
    
    if (!threads) {
      throw Object.assign(new Error("Thread not found"), { statusCode: 404 });
    }
    const user = await users.findById(id)
    console.log(user._id, threads.thread_owner)
    if(user._id.toString() !== threads.thread_owner.toString()){
    throw Object.assign(new Error("not authorized"), { statusCode: 403 });
    }
    const { topic, category,thread } = req.body;
    threads.topic = topic;
    threads.category = category;
    threads.thread = thread;
    const savedthread = await threads.save();
    res.status(200).json({
      savedthread
    });
    logger.info(`Thread ${threadId} updated by ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode:error.statusCode });
  }
})


const generateToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );
};
module.exports = { threadlogic,getOnethread,getallthread, comments,deletethread,getThreadWithComments,updateThread };
