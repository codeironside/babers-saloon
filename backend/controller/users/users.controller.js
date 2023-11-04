const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const USER = require("../../model/users/user");
const logger = require("../../utils/logger");
const { DateTime } = require("luxon");
const { convertToWAT } = require("../../utils/datetime");

const currentDateTimeWAT = DateTime.now().setZone("Africa/Lagos");
//
//desc login users
//access private-depending on endpoint needs
//routes /users/login
const MAX_LOGIN_ATTEMPTS = 5;
const COOLDOWN_PERIOD = 60 * 60 * 1000; // 1 hour in milliseconds

const loginAttempts = new Map();

const login_users = asynchandler(async (req, res) => {
  const { userName, password } = req.body;
  const clientIp = req.clientIp;
  // console.log(userName);
  // Check if there are too many login attempts from this IP address
  if (loginAttempts.has(clientIp)) {
    const attempts = loginAttempts.get(clientIp);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      throw new Error("Too many login attempts. Try again later.");
      const location = await getLocation(clientIp);
      logger.error(
        `user with id ${
          user._id
        } to many login attempts ${currentDateTimeWAT.toString()} - ${
          res.statusCode
        } - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${
          req.ip
        } - ${req.session.id} - with IP: ${req.clientIp} from ${location}`
      );
    }
  }

  if (!userName || !password) {
    const location = await getLocation(clientIp);
    logger.error(
      ` attempted log in at ${currentDateTimeWAT.toString()} - ${
        res.statusCode
      } - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${
        req.ip
      } - ${req.session.id} - with IP: ${req.clientIp} from ${location}`
    );
    throw new Error("fields can not be empty");
  }
  const user = await USER.findOne({ userName: userName });
  // console.log(user);
  if (!user) {
    throw new Error("User does not exist");
  }

  if (await bcrypt.compare(password, user.password)) {
    // Successful login
    // Reset the login attempts for this IP address
    loginAttempts.delete(clientIp);

    const referredUsers = await USER.find(
      { referredBy: user.referCode },
      "firstName lastName userName pictureUrl"
    );
    console.log(user.referCode);
    const referralCount = referredUsers.length;
    const token = generateToken(user._id);
    const userWithoutPassword = await USER.findById(user.id).select(
      "-password"
    );
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: 200,
      user: userWithoutPassword,
      referralCount: referralCount,
      referredUsers: referredUsers,
    });
    // Log successful login
    const location = await getLocation(clientIp);
    logger.info(
      `user with id ${
        user._id
      } logged in at ${currentDateTimeWAT.toString()} - ${res.statusCode} - ${
        res.statusMessage
      } - ${req.originalUrl} - ${req.method} - ${req.ip} - ${
        req.session.id
      } - with IP: ${req.clientIp} from ${location}`
    );
  } else {
    // Failed login attempt
    // Track the login attempt
    if (loginAttempts.has(clientIp)) {
      loginAttempts.set(clientIp, loginAttempts.get(clientIp) + 1);
    } else {
      loginAttempts.set(clientIp, 1);
      setTimeout(() => {
        loginAttempts.delete(clientIp);
      }, COOLDOWN_PERIOD);
    }

    // res.status(401).json({
    //   error: "Invalid credentials",
    // });
    const location = await getLocation(clientIp);
    logger.error(
      `user with id ${
        user._id
      } attempted to log in at ${currentDateTimeWAT.toString()} - ${
        res.statusCode
      } - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${
        req.ip
      } - ${req.session.id} - with IP: ${req.clientIp} from ${location}`
    );
    throw new Error("invalid credentials");
  }
});

//desc register users
//access public
//router /users/register
const register_users = asynchandler(async (req, res) => {
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
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !userName ||
    !phoneNumber
  ) {
    throw new Error("fields cannot be empty");
  }

  const findemail = await USER.findOne({ email: email });
  if (findemail) {
    throw new Error("user already exists");
  }
  const exist = await USER.findOne({ userName: userName });
  if (exist) throw new Error("user Name already exist");
  const salt = await bcrypt.genSalt(10);
  const hashedpassword = await bcrypt.hash(password, salt);

  const createUsers = await USER.create({
    firstName,
    middleName,
    lastName,
    email,
    password: hashedpassword,
    userName,
    phoneNumber,
    referredBy: referralCode, // Add the referral code to the model
  });
  const codeone = createUsers._id.toString().slice(3, 7);
  const codetwo = firstName.toString().slice(0, 3);
  const codethree =firstName.toString().slice(0, 2);
  const codefour =userName.toString().slice(0, 2);
  const referrCode = `REF-${codeone}${codetwo}${codethree}${codefour}${codetwo}`;

  const updatereferral = await USER.findByIdAndUpdate(
    createUsers._id,
    { $set: { referCode: referrCode } },
    { new: true }
  );
  const location = await getLocation(ip);
  const token = generateToken(createUsers._id);
  let referredUsers;
  if (referralCode) {
    referredUsers = await USER.find(
      { referredBy: referrCode },
      "firstName lastName userName pictureUrl"
    );
  } else {
    referredUsers = [];
  }
  if (createUsers) {
    res.status(202).header("Authorization", `Bearer ${token}`).json({
      status: "202",
      message: updatereferral,
      referralCount: referredUsers.length,
      referredUsers: referredUsers,
    });

    logger.info(
      `user with id ${createUsers._id}, was created at ${createUsers.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${req.session.id} - from ${location}`
    );
  }
});

//access  private
//route /users/landing_page
//desc landing user page
const landing_page = asynchandler(async (req, res) => {
  try {
    const shops = await SHOPS.find().sort({ createdAt: -1 });
    const blogs = await BLOG.find().sort({ createdAt: -1 });

    let blogDict = {};
    for (const blog of blogs) {
      const comments = await COMMENT.find({ blog_id: blog._id });
      blog.comments = comments;
      blogDict[blog] = comments;
    }

    const sortedShops = shops.sort((a, b) => b.createdAt - a.createdAt);
    const sortedBlogs = Object.keys(blogDict).sort(
      (a, b) => b.createdAt - a.createdAt
    );

    // const token = generateToken(id);
    // res.status(200).header("Authorization", `Bearer ${token}`)
    res.status(200).json({
      data: {
        shops: sortedShops,
        blogs: sortedBlogs,
      },
    });

    logger.info(
      `Landing page data fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
    );
  } catch (error) {
    console.error(error);
    throw new Error(`${error}`);
  }
});

//get one user
//access private for user
const getUser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;

    const user = await USER.findById(id);
    if (id === user._id || process.env.role === "superadmin") {
      if (!user) {
        throw new Error("User not found");
      }

      const referredUsers = await USER.find(
        { referredBy: user.referCode },
        "firstName lastName userName pictureUrl"
      );
      const referralCount = referredUsers.length;

      res.status(200).json({
        status: 200,
        user: user,
        referralCount: referralCount,
        referredUsers: referredUsers,
      });

      logger.info(
        `User with id ${userId} information was fetched successfully. Referred users count: ${referralCount}`
      );
    } else {
      throw new Error("unauthorized");
    }
  } catch (error) {
    throw new Error(`${error}`);
  }
});
//desc get all users for admin
//access private for admins only
//access private
// desc list all shops
// route /shops/al

const getallusers = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  console.log(page, "   ", pageSize);
  const { id } = req.auth;
  const user = await USER.findById(id);
  try {
    if (user.role === "superadmin" || process.env.role === "superadmin") {
      const users = await USER.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize);

      const totalCount = await USER.countDocuments();

      const referredUsers = await USER.aggregate([
        {
          $match: {
            referredBy: { $exists: true },
          },
        },
        {
          $group: {
            _id: "$referredBy",
            count: { $sum: 1 },
          },
        },
      ]);

      const usersWithReferrals = users.map((user) => {
        const referral = referredUsers.find(
          (referral) => referral._id === user._id.toString()
        );
        const referralCount = referral ? referral.count : 0;
        return {
          ...user.toObject(),
          referredUsers: referralCount,
        };
      });

      const usersWithoutReferrals = await USER.find({
        referredBy: { $exists: false },
      });

      const token = generateToken(id);
      res
        .status(200)
        .header("Authorization", `Bearer ${token}`)
        .json({
          data: [...usersWithReferrals,"rf", ...usersWithoutReferrals],
          page: page,
          totalPages: Math.ceil(totalCount / pageSize),
        })
      logger.info(
        `shops were fetched ${currentTime} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
      );
    } else {
      throw new Error("not authorized");
    }
  } catch (error) {
    console.log(error);
    throw new Error(`${error}`);
  }
});

// Controller function to update a user
//route /user/updateac
//access private
//data updateData
const updateUser = async (req, res) => {
  const { userId } = req.params; // Get the user ID from the route parameters
  const clientIp = req.clientIp;
  const { id } = req.auth;
  const updateData = req.body; // Get the updated data from the request body

  try {
    if (!userId) {
      throw new Error("params is empty");
    }

    if (!updateData) {
      throw new Error("body is empty");
    }
    const updatUser = await USER.findById(id);
    if (updateData.userName === updatUser.userName) {
      throw new Error("not allowed");
    }
    const updatedUser = await USER.findByIdAndUpdate(id, updateData, {
      new: true, // Return the updated user document
    });

    if (!updatedUser) {
      throw new Error("user not found ");
    }

    const token = generateToken(shop._id);
    res
      .status(200)
      .header("Authorization", `Bearer ${token}`)
      .json(updatedUser);
    const createdAt = updatedUser.updatedAt; // Assuming createdAt is a Date object in your Mongoose schema
    const watCreatedAt = convertToWAT(createdAt);
    const location = await getLocation(clientIp);
    logger.info(
      `user with id ${userId},updated profile ${watCreatedAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}  - from ${location}`
    );
  } catch (error) {
    console.error(error);
    throw new Error("server Error");
  }
};
const getLocation = asynchandler(async (ip) => {
  try {
    // Set endpoint and your access key
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
//update subscription
//access private
const forum_status = asynchandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const { id } = req.auth;
    const { user_id } = req.params;
    const { status } = req.body;
    const role = await USER.findById(id);
    if (!(role._role === "superadmin") || !(process.env.role === "superadmin"))
      throw new Error("not authorized");
    const updatedUser = await USER.findByIdAndUpdate(
      user_id,
      { $set: { banned_from_forum: status } },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error("User not found or blog_owner is already false");
    }

    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      successful: true,
    });
    logger.info(
      `admin with id ${id}, changed user with ${user_id} forum status - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location} `
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

const searchItems = asynchandler(async (req, res) => {
  const query = req.query.query;
  try {
    const shopResults = await SHOPS.find({ $text: { $search: query } }).sort({
      createdAt: -1,
    });
    const blogResults = await BLOG.find({ $text: { $search: query } }).sort({
      createdAt: -1,
    });

    const token = generateToken(id);
    res
      .status(200)
      .header("Authorization", `Bearer ${token}`)
      .json({
        data: {
          shops: shopResults,
          blogs: blogResults,
        },
      });

    logger.info(
      `Search results fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
    );
  } catch (error) {
    console.error(error);
    throw new Error(`${error}`);
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
};
