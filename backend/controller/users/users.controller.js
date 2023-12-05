const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const USER = require("../../model/users/user");
const SHOPS = require("../../model/shops/shop");
const COMMENT = require("../../model/blogs/comments");
const BLOGS = require("../../model/blogs/blog");
const logger = require("../../utils/logger");
const { DateTime } = require("luxon");
const { convertToWAT } = require("../../utils/datetime");
const BOOKING = require("../../model/payment/booking");

const currentDateTimeWAT = DateTime.now().setZone("Africa/Lagos");
/**
 * @api {post} /login Login User
 * @apiName LoginUser
 * @apiGroup User
 *
 * @apiParam {String} email User's email.
 * @apiParam {String} password User's password.
 *
 * @apiSuccess {Object} userWithoutPassword User object without password.
 * @apiSuccess {Number} referralCount Number of users referred by the user.
 * @apiSuccess {Array} referredUsers Array of users referred by the user.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "userWithoutPassword": {
 *         "_id": "userId",
 *         "email": "user@example.com",
 *         // other user fields
 *       },
 *       "referralCount": 5,
 *       "referredUsers": [
 *         // array of user objects
 *       ],
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (400) FieldsEmpty Email and password cannot be empty.
 * @apiError (401) InvalidCredentials The provided credentials are invalid.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "FieldsEmpty"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "InvalidCredentials"
 *     }
 */

const login_users = asynchandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw Object.assign(new Error("Fields cannot be empty"), {
        statusCode: 400,
      });
    }
    const user = await USER.findOne({ email: email });
    // console.log(user);
    if (!user) {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      const referredUsers = await USER.find(
        { referredBy: user.referCode },
        "firstName lastName userName pictureUrl"
      );
      const appointments = await BOOKING.find({ user: user._id });
      const bum = await BLOGS.find({ owner_id: user._id });
      const referralCount = referredUsers.length;
      const appointmentCount = appointments.length;
      const blogCount = bum.length;
      // console.log(blogCount);
      const token = generateToken(user._id);
      const userWithoutPassword = await USER.findById(user.id).select(
        "-password"
      );
      res
        .status(200)
        .header("Authorization", `Bearer ${token}`)
        .json({
          ...userWithoutPassword._doc,
          referralCount,
          appointmentCount,
          blogCount,
          referredUsers,
        });
      logger.info(
        `user with id ${
          user._id
        } logged in at ${currentDateTimeWAT.toString()} - ${res.statusCode} - ${
          res.statusMessage
        } - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    } else {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
      });
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

/**
 * @api {post} /register Register User
 * @apiName RegisterUser
 * @apiGroup User
 *
 * @apiParam {String} firstName User's first name.
 * @apiParam {String} middleName User's middle name.
 * @apiParam {String} lastName User's last name.
 * @apiParam {String} email User's email.
 * @apiParam {String} password User's password.
 * @apiParam {String} userName User's username.
 * @apiParam {String} phoneNumber User's phone number.
 * @apiParam {String} referralCode Referral code of the user who referred this user.
 * @apiParam {String} pictureUrl URL of the user's picture.
 *
 * @apiSuccess {Object} userWithoutPassword User object without password.
 * @apiSuccess {Number} referralCount Number of users referred by the user.
 * @apiSuccess {Array} referredUsers Array of users referred by the user.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 202 Accepted
 *     {
 *       "userWithoutPassword": {
 *         "_id": "userId",
 *         "email": "user@example.com",
 *         // other user fields
 *       },
 *       "referralCount": 5,
 *       "referredUsers": [
 *         // array of user objects
 *       ],
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (400) FieldsEmpty First name, last name, email, password, username, and phone number cannot be empty.
 * @apiError (409) UserExists User already exists.
 * @apiError (409) UserNameExists Username already exists.
 * @apiError InvalidReferralCode The provided referral code is invalid.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "FieldsEmpty"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 409 Conflict
 *     {
 *       "error": "UserExists"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 409 Conflict
 *     {
 *       "error": "UserNameExists"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "InvalidReferralCode"
 *     }
 */
const register_users = asynchandler(async (req, res) => {
  try {
    const ip = req.ip;
    const {
      firstName,
      middleName,
      lastName,
      email,
      password,
      userName,
      phoneNumber,
      referralCode,
      pictureUrl,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !userName ||
      !phoneNumber
    ) {
      throw Object.assign(new Error("Fields cannot be empty"), {
        statusCode: 400,
      });
    }

    const findEmail = await USER.findOne({ email: email });
    if (findEmail) {
      throw Object.assign(new Error("User already exists"), {
        statusCode: 409,
      });
    }

    const exist = await USER.findOne({ userName: userName });
    if (exist)
      throw Object.assign(new Error("User Name already exists"), {
        statusCode: 409,
      });
    let referredUsers = [];

    if (referralCode) {
      const referrer = await USER.findOne({ referCode: referralCode });
      if (!referrer) {
        throw new Error("Invalid referral code");
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const createUsers = await USER.create({
        firstName,
        middleName,
        lastName,
        email,
        password: hashedPassword,
        userName,
        phoneNumber,
        pictureUrl,
        referredBy: referralCode,
      });

      const codeOne = createUsers._id.toString().slice(2, 9);
      const codeTwo = firstName.toString().slice(0, 3);
      const codeThree = firstName.toString().slice(0, 2);
      const codeFour = userName.toString().slice(0, 2);
      const referrerCode = `REF-${codeOne}${codeTwo}${codeThree}${codeFour}${codeTwo}`;

      const updateReferral = await USER.findByIdAndUpdate(
        createUsers._id,
        { $set: { referCode: referrerCode } },
        { new: true }
      );

      const token = generateToken(createUsers._id);

      referredUsers = await USER.find(
        { referredBy: referrerCode },
        "firstName lastName userName pictureUrl"
      );

      res
        .status(202)
        .header("Authorization", `Bearer ${token}`)
        .json({
          ...userWithoutPassword._doc,
          referredUsers,
        });

      logger.info(
        `User with ID ${createUsers._id} was created at ${createUsers.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    } else {
      // Continue the registration process without referral code
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const createUsers = await USER.create({
        firstName,
        middleName,
        lastName,
        email,
        pictureUrl,
        password: hashedPassword,
        userName,
        phoneNumber,
      });

      const codeOne = createUsers._id.toString().slice(3, 7);
      const codeTwo = firstName.toString().slice(0, 3);
      const codeThree = firstName.toString().slice(0, 2);
      const codeFour = userName.toString().slice(0, 2);
      const referrerCode = `REF-${codeOne}${codeTwo}${codeThree}${codeFour}${codeTwo}`;

      const updateReferral = await USER.findByIdAndUpdate(
        createUsers._id,
        { $set: { referCode: referrerCode } },
        { new: true }
      );
      const token = generateToken(createUsers._id);

      res.status(202).header("Authorization", `Bearer ${token}`).json({
        status: "202",
        message: updateReferral,
        referralCount: referredUsers.length,
        referredUsers: referredUsers,
      });

      logger.info(
        `User with ID ${createUsers._id} was created at ${createUsers.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

/**
 * @api {get} /users Get Landing Page Data
 * @apiName GetLandingPageData
 * @apiGroup LandingPage
 *
 * @apiHeader {String} Authorization User's authorization token.
 *
 * @apiSuccess {Array} data Array of shop and blog objects sorted by creation date.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "_id": "shopId",
 *           "name": "shopName",
 *           "type": "shop",
 *           // other shop fields
 *         },
 *         {
 *           "_id": "blogId",
 *           "title": "blogTitle",
 *           "type": "blog",
 *           // other blog fields
 *         },
 *         // more shop and blog objects
 *       ]
 *     }
 *
 * @apiError (404) UserNotFound The user was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 */

const landing_page = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;

    const user = await USER.findById(id);
    if (!user)
      throw Object.assign(new Error("User not found"), { statusCode: 404 });
    const shops = await SHOPS.find({ approved: true });

    // Define the order of subscription types
    const subscriptionOrder = ["platinum", "gold", "basic"];

    // Sort shops based on subscription type and creation date
    shops.sort((a, b) => {
      const aIndex = subscriptionOrder.indexOf(a.subscriptionType);
      const bIndex = subscriptionOrder.indexOf(b.subscriptionType);

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      // If the subscription type is the same, sort by creation date
      return b.createdAt - a.createdAt;
    });

    const blogs = await BLOGS.find({ approved: true });

    let blogDict = {};
    for (const blog of blogs) {
      const commentCount = await COMMENT.countDocuments({ blog_id: blog._id });
      blog.commentCount = commentCount;
      blogDict[blog] = commentCount;
    }

    const sortedShops = shops.map((shop) => ({ ...shop._doc, type: "shop" }));
    const sortedBlogs = Object.keys(blogDict).map((blog) => ({
      ...blog,
      type: "blog",
    }));

    const combinedData = [...sortedShops, ...sortedBlogs];

    combinedData.sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({
      data: combinedData,
    });

    logger.info(
      `Landing page data fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

/**
 * @api {get} /home Get Landing Page Data
 * @apiName GetLandingPageData
 * @apiGroup LandingPage
 *
 * @apiSuccess {Array} data Array of shop and blog objects sorted by subscription type and creation date.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "_id": "shopId",
 *           "name": "shopName",
 *           "subscriptionType": "platinum",
 *           "createdAt": "creationDate",
 *           // other shop fields
 *         },
 *         {
 *           "_id": "blogId",
 *           "title": "blogTitle",
 *           "commentCount": 5,
 *           "createdAt": "creationDate",
 *           // other blog fields
 *         },
 *         // more shop and blog objects
 *       ]
 *     }
 *
 * @apiError (500) ServerError An error occurred on the server.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "ServerError"
 *     }
 */

const landingpage = asynchandler(async (req, res) => {
  try {
    const shops = await SHOPS.find({ approved: true });

    // Define the order of subscription types
    const subscriptionOrder = ["platinum", "gold", "basic"];

    // Sort shops based on subscription type and creation date
    shops.sort((a, b) => {
      const aIndex = subscriptionOrder.indexOf(a.subscriptionType);
      const bIndex = subscriptionOrder.indexOf(b.subscriptionType);

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }

      // If the subscription type is the same, sort by creation date
      return b.createdAt - a.createdAt;
    });

    const blogs = await BLOGS.find({ approved: true });

    for (const blog of blogs) {
      const commentCount = await COMMENT.countDocuments({ blog_id: blog._id });
      blog.commentCount = commentCount;
    }

    // Mix blogs with sorted shops
    let combinedData = [];
    let shopIndex = 0;
    let blogIndex = 0;

    while (shopIndex < shops.length || blogIndex < blogs.length) {
      if (shopIndex < shops.length) {
        combinedData.push(shops[shopIndex++]);
      }

      if (blogIndex < blogs.length) {
        combinedData.push(blogs[blogIndex++]);
      }
    }

    res.status(200).json({
      data: combinedData,
    });

    logger.info(
      `Landing page data fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - from ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

/**
 * @api {get} /getone Get User Data
 * @apiName GetUserData
 * @apiGroup User
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} user_id ID of the user to get data for.
 *
 * @apiSuccess {Object} user User object.
 * @apiSuccess {Number} referralCount Number of users referred by the user.
 * @apiSuccess {Array} referredUsers Array of users referred by the user.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 202 Accepted
 *     {
 *       "status": 200,
 *       "user": {
 *         "_id": "userId",
 *         "email": "user@example.com",
 *         // other user fields
 *       },
 *       "referralCount": 5,
 *       "referredUsers": [
 *         // array of user objects
 *       ],
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (404) UserNotFound The user was not found.
 * @apiError Unauthorized The user is not authorized to access this data.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 404 Not Found
 *     {
 *       "error": "UserNotFound"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "Unauthorized"
 *     }
 */

const getUser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { user_id } = req.body;
    const user = await USER.findById(user_id);
    const admin = await USER.findById(d);
    if (admin.role === "superadmin" || process.env.role === "superadmin") {
      owner = true;
      if (!user) {
        throw Object.assign(new Error("user Not authorized"), {
          statusCode: 403,
        });
      }

      const referredUsers = await USER.find(
        { referredBy: user.referCode },
        "firstName lastName userName pictureUrl"
      );
      const referralCount = referredUsers.length;
      const token = generateToken(id);
      res.status(202).header("Authorization", `Bearer ${token}`).json({
        status: 200,
        user: user,
        referralCount: referralCount,
        referredUsers: referredUsers,
      });

      logger.info(
        `User with id ${userId} information was fetched successfully. ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - from ${req.ip}`
      );
    } else {
      throw new Error("unauthorized");
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

//one user
const oneUser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (id === user._id.toString() || process.env.role === "superadmin") {
      if (!user) {
        throw Object.assign(new Error("user Not authorized"), {
          statusCode: 403,
        });
      }

      const referredUsers = await USER.find(
        { referredBy: user.referCode },
        "firstName lastName userName pictureUrl"
      );
      const referralCount = referredUsers.length;
      const token = generateToken(id);
      res.status(202).header("Authorization", `Bearer ${token}`).json({
        user: user,
        referralCount: referralCount,
        referredUsers: referredUsers,
      });

      logger.info(
        `User with id ${id} information was fetched successfully. ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method}  - from ${req.ip}`
      );
    } else {
      throw Object.assign(new Error(`unauthorized`), { statusCode: 403 });
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});
/**
 * @api {get} /getall Get All Users
 * @apiName GetAllUsers
 * @apiGroup User
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {Number} [page=1] Page number.
 * @apiParam {Number} [pageSize=10] Number of users per page.
 *
 * @apiSuccess {Array} data Array of user objects with referral counts.
 * @apiSuccess {Number} page Current page number.
 * @apiSuccess {Number} totalPages Total number of pages.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "_id": "userId",
 *           "email": "user@example.com",
 *           "referralCount": 5,
 *           // other user fields
 *         },
 *         // more user objects
 *       ],
 *       "page": 1,
 *       "totalPages": 10,
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (403) NotAuthorized The user is not authorized to access this data.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 403 Forbidden
 *     {
 *       "error": "NotAuthorized"
 *     }
 */

const getallusers = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  console.log(page, "   ", pageSize);
  const { id } = req.auth;
  const user = await USER.findById(id);
  try {
    if (user.role === "superadmin" || process.env.role === "superadmin") {
      const allUsers = await USER.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize);
      const referredUsers = await USER.aggregate([
        {
          $group: {
            _id: "$referredBy",
            count: { $sum: 1 },
          },
        },
      ]);

      const usersWithReferrals = allUsers.map((user) => {
        const referral = referredUsers.find((u) => u._id === user.referCode);
        return {
          ...user._doc,
          referralCount: referral ? referral.count : 0,
        };
      });

      const totalCount = await USER.countDocuments();

      const token = generateToken(id);
      res
        .status(200)
        .header("Authorization", `Bearer ${token}`)
        .json({
          data: usersWithReferrals,
          page: page,
          totalPages: Math.ceil(totalCount / pageSize),
        });

      logger.info(
        `users were fetched- ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method}  from ${req.ip}`
      );
    } else {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }
  } catch (error) {
    console.log(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

/**
 * @api {put} /update/:userId Update User Data
 * @apiName UpdateUserData
 * @apiGroup User
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} userId ID of the user to update.
 * @apiParam {Object} updateData Data to update.
 *
 * @apiSuccess {Object} updatedUser Updated user object.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "_id": "userId",
 *       "email": "user@example.com",
 *       // other updated user fields
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (400) FieldsEmpty User ID and update data cannot be empty.
 * @apiError (403) NotAuthorized The user is not authorized to update this data.
 * @apiError (404) UserNotFound The user was not found.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "FieldsEmpty"
 *     }
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
 *       "error": "UserNotFound"
 *     }
 */

const updateUser = asynchandler(async (req, res) => {
  const { userId } = req.params;
  const clientIp = req.clientIp;
  const { id } = req.auth;
  const updateData = req.body;

  try {
    if (!userId || !updateData) {
      throw Object.assign(new Error("Fields cannot be empty"), {
        statusCode: 400,
      });
    }

    const updatUser = await USER.findById(userId);
    console.log(updatUser._id);
    if (userId !== updatUser._id.toString()) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 403 });
    }
    // if (req.body.data) {
    //   const result = await cloudinary.uploader.upload(req.body.data, { resource_type: 'image', format: 'png' });
    //   updateData.profile_image = result.secure_url;
    // }
    const updatedUser = await USER.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      throw Object.assign(new Error("User not  found"), { statusCode: 404 });
    }

    const token = generateToken(id);
    res
      .status(200)
      .header("Authorization", `Bearer ${token}`)
      .json(updatedUser);
    const createdAt = updatedUser.updatedAt; // Assuming createdAt is a Date object in your Mongoose schema
    const watCreatedAt = convertToWAT(createdAt);
    const location = await getLocation(clientIp);
    logger.info(
      `user with id ${userId},updated profile ${watCreatedAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}  - from ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const changePassword = asynchandler(async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const { userId } = req.params;
    if (!userId || !oldPassword || !newPassword) {
      throw Object.assign(new Error("Fields cannot be empty"), {
        statusCode: 400,
      });
    }

    const user = await USER.findById(userId);

    if (!user) {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
      });
    }

    if (await bcrypt.compare(oldPassword, user.password)) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      const updatedUser = await USER.findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        { new: true }
      );
      res.status(200).json({
        message: "Password changed successfully",
        user: updatedUser,
      });
    } else {
      throw Object.assign(new Error("Invalid credentials"), {
        statusCode: 401,
      });
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const getLocation = asynchandler(async (ip) => {
  try {
    const accessKey = process.env.ip_secret_key;
    const url =
      "http://apiip.net/api/check?ip=" + ip + "&accessKey=" + accessKey;

    // Make a request and store the response
    const response = await fetch(url);

    // Decode JSON response:
    const result = await response.json();

    // Output the "code" value inside "currency" object
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
  }
});
/**
 * @api {put} /updatefor/:userId Update User Forum Status
 * @apiName UpdateUserForumStatus
 * @apiGroup User
 *
 * @apiHeader {String} Authorization User's authorization token.
 * @apiParam {String} userId ID of the user to update.
 * @apiParam {Boolean} status New forum status.
 *
 * @apiSuccess {Boolean} successful Indicates whether the update was successful.
 * @apiSuccess {String} token Authorization token.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "successful": true,
 *       "token": "authorizationToken"
 *     }
 *
 * @apiError (400) ErrorUpdating An error occurred while updating the user.
 * @apiError Unauthorized The user is not authorized to update this data.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "ErrorUpdating"
 *     }
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "Unauthorized"
 *     }
 */

const forum_status = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { userId } = req.params;
    const { status } = req.body;
    const role = await USER.findById(id);
    if (
      role._role === "superadmin" ||
      !(process.env.role.toString() === "superadmin")
    )
      throw new Error("not authorized");
    const updatedUser = await USER.findByIdAndUpdate(
      userId,
      { $set: { banned_from_forum: status } },
      { new: true }
    );
    if (!updatedUser) {
      throw Object.assign(new Error("error updating"), { statusCode: 400 });
    }

    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      successful: true,
    });
    logger.info(
      `admin with id ${id}, changed user with ${userId} forum status - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip} `
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const generateToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "48h" }
  );
};
/**
 * @api {get} /search Search Items
 * @apiName SearchItems
 * @apiGroup Search
 *
 * @apiParam {String} query Search query.
 *
 * @apiSuccess {Array} data Array of shop and blog objects sorted by creation date.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "_id": "shopId",
 *           "name": "shopName",
 *           "createdAt": "creationDate",
 *           // other shop fields
 *         },
 *         {
 *           "_id": "blogId",
 *           "title": "blogTitle",
 *           "createdAt": "creationDate",
 *           // other blog fields
 *         },
 *         // more shop and blog objects
 *       ]
 *     }
 *
 * @apiError (500) ServerError An error occurred on the server.
 *
 * @apiErrorExample Error-Response:
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "error": "ServerError"
 *     }
 */

const searchItems = asynchandler(async (req, res) => {
  const query = req.query.query;
  try {
    const shopResults = await SHOPS.find({ $text: { $search: query } });
    const blogResults = await BLOGS.find({ $text: { $search: query } });

    // Combine and sort the results
    const combinedResults = [...shopResults, ...blogResults].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    // const token = generateToken(id);.header("Authorization", `Bearer ${token}`)
    res.status(200).json({
      data: combinedResults,
    });

    logger.info(
      `Search results fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});
const logout_user = asynchandler(async (req, res) => {
  try {
    res.status(200).header("Authorization", null).json({
      message: "Logged out successfully",
    });
    logger.info(
      `user with id ${
        req.user._id
      } logged out at ${currentDateTimeWAT.toString()} - ${res.statusCode} - ${
        res.statusMessage
      } - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

module.exports = {
  register_users,
  login_users,
  landing_page,
  updateUser,
  getUser,
  getallusers,
  forum_status,
  searchItems,
  landingpage,
  oneUser,
  changePassword,
  logout_user
};
