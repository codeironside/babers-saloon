const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const USER = require("../../model/users/user");
const logger = require("../../utils/logger");
const { DateTime } = require("luxon");
const {convertToWAT} = require('../../utils/datetime')

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
console.log(userName)
  // Check if there are too many login attempts from this IP address
  if (loginAttempts.has(clientIp)) {
    const attempts = loginAttempts.get(clientIp);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      throw new Error(
        "Too many login attempts. Try again later.",
      );
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
  throw new Error("fields can not be empty")
  

  }
  const user = await USER.findOne({ userName: userName });
  console.log(user);
  if (!user) {
    throw new Error("User does not exist");
  }

  if (await bcrypt.compare(password, user.password)) {
    // Successful login
    // Reset the login attempts for this IP address
    loginAttempts.delete(clientIp);

    const token = generateToken(user._id); // Replace with your actual token

    res.status(200).header("Authorization", `Bearer ${token}`).json({
      message: "successful",
      data: user,
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
  } = req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !userName ||
    !phoneNumber
  ) {
    throw new Error("fields can not be empty");
  }
  const findemail = await USER.findOne({ email: email });
  if (findemail) {
    throw new Error("user already exist");
  }
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
  });
  const location = await getLocation(ip);
  console.log(ip);
  const token = generateToken(createUsers._id);
  if (createUsers) {
    res.status(202).header("Authorization", `Bearer ${token}`).json({
      status: "202",
      message: "User created",
      token: token,
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
  const { id } = req.auth;
  if (id) {
    const User = await USER.findById({ _id: id });
    const token = generateToken(User._id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: User,
    });
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

// Controller function to update a user
//route /user/updateac
//access private
//data updateData
const updateUser = async (req, res) => {
  const { userId } = req.params; // Get the user ID from the route parameters
  const clientIp = req.clientIp;
  const updateData = req.body; // Get the updated data from the request body

  try {
    if(!userId){throw new Error('params is empty')}
    // Use findByIdAndUpdate to update the user document by ID
    if(!updateData){
      throw new Error("body is empty")
    }
    const updatedUser = await USER.findByIdAndUpdate(userId, updateData, {
      new: true, // Return the updated user document
    });

    if (!updatedUser) {
      throw new Error('user not found ')
    }

    res.status(202).json(updatedUser);
    const createdAt = updatedUser.updatedAt; // Assuming createdAt is a Date object in your Mongoose schema
  const watCreatedAt = convertToWAT(createdAt);
  const location = await getLocation(clientIp);
    logger.info(
      `user with id ${userId},updated profile ${watCreatedAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}  - from ${location}`
    );
  } catch (error) {
    console.error(error);
    throw new Error('server Error')
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
module.exports = { register_users, login_users, landing_page, updateUser };
