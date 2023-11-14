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

const currentDateTimeWAT = DateTime.now().setZone("Africa/Lagos");
//
//desc login users
//access private-depending on endpoint needs
//routes /users/login
const login_users = asynchandler(async (req, res) => {
  const { userName, password } = req.body;


  if (!userName || !password) {
    throw new Error("fields can not be empty");
  }
  const user = await USER.findOne({ userName: userName });
  // console.log(user);
  if (!user) {
    throw new Error("User does not exist");
  }

  if (await bcrypt.compare(password, user.password)) {
    const referredUsers = await USER.find(
      { referredBy: user.referCode },
      "firstName lastName userName pictureUrl"
    );
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
    logger.info(
      `user with id ${
        user._id
      } logged in at ${currentDateTimeWAT.toString()} - ${res.statusCode} - ${
        res.statusMessage
      } - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } else {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 })
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
    pictureUrl
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !userName ||
    !phoneNumber
  ) {
    throw new Error("Fields cannot be empty");
  }

  const findEmail = await USER.findOne({ email: email });
  if (findEmail) {
    throw new Error("User already exists");
  }

  const exist = await USER.findOne({ userName: userName });
  if (exist) throw new Error("Username already exists");

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

    const location = await getLocation(ip);
    const token = generateToken(createUsers._id);

    referredUsers = await USER.find(
      { referredBy: referrerCode },
      "firstName lastName userName pictureUrl"
    );

    res.status(202).header("Authorization", `Bearer ${token}`).json({
      status: "202",
      message: updateReferral,
      referralCount: referredUsers.length,
      referredUsers: referredUsers,
    });

    logger.info(
      `User with ID ${createUsers._id} was created at ${createUsers.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${req.session.id} - from ${location}`
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

    const location = await getLocation(ip);
    const token = generateToken(createUsers._id);

    res.status(202).header("Authorization", `Bearer ${token}`).json({
      status: "202",
      message: updateReferral,
      referralCount: referredUsers.length,
      referredUsers: referredUsers,
    });

    logger.info(
      `User with ID ${createUsers._id} was created at ${createUsers.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${req.session.id} - from ${location}`
    );
  }
});


//access  private
//route /users/landing_page
//desc landing user page
const landing_page = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;

    const user = await USER.findById(id);
    if (!user) throw new Error("User not found");

    const shops = await SHOPS.find({ approved: true });

    // Define the order of subscription types
    const subscriptionOrder = ['platinum', 'gold', 'basic'];

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
    throw new Error(`${error}`);
  }
});
//access  public
//route /users/landing_page
//desc landing user page
const landingpage = asynchandler(async (req, res) => {
  try {

    const shops = await SHOPS.find({ approved: true });

    // Define the order of subscription types
    const subscriptionOrder = ['platinum', 'gold', 'basic'];

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
    throw new Error(`${error}`);
  }
});

//get one user
//access private for user
const getUser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { user_id } = req.body;
    let owner = false;
    const user = await USER.findById(user_id);
    if (id === user._id || process.env.role === "superadmin") {
      owner = true;
      if (!user) {
        throw new Error("User not found");
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
        `users were fetched- ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
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
    const updatUser = await USER.findById(userId);
    console.log(updatUser._id);
    if (
      !(userId === updatUser._id.toString()) ||
      !(process.env.role === "superadmin")
    ) {
      throw new Error("not allowed");
    }
    const updatedUser = await USER.findByIdAndUpdate(userId, updateData, {
      new: true, // Return the updated user document
    });

    if (!updatedUser) {
      throw new Error("user not found ");
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
      throw new Error("User not found or blog_owner is already false");
    }

    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      successful: true,
    });
    logger.info(
      `admin with id ${id}, changed user with ${userId} forum status - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip} `
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
  landingpage
};
