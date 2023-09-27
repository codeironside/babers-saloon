const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bycrypt = require("bcryptjs")
const USER = require("../../model/users/user");
const logger = require("../../utils/logger");
//
//desc login users
//access private-depending on endpoint needs
//routes /users/login
const MAX_LOGIN_ATTEMPTS = 5;
const COOLDOWN_PERIOD = 60 * 60 * 1000; // 1 hour in milliseconds

const loginAttempts = new Map();

const login_users = asynchandler(async (req, res) => {
  const { id } = req.auth;
  const { userName, password } = req.body;
  const clientIp = req.clientIp;

  // Check if there are too many login attempts from this IP address
  if (loginAttempts.has(clientIp)) {
    const attempts = loginAttempts.get(clientIp);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      res.status(429).json({
        error: "Too many login attempts. Try again later.",
      });
      const location = await getLocation(clientIp);
      logger.error(
        `user with id ${
          user._id
        } to many login attempts ${new Date().toISOString()} - ${res.status} - ${
          res.statusMessage
        } - ${req.originalUrl} - ${req.method} - ${req.ip} - ${
          req.session.id
        } - with IP: ${req.clientIp} from ${location}`
      );
    }
  }

  if (!id) {
    res.status(403).json({
      error: "You are not authorized to access this resource",
      status: 403,
    });
    const location = await getLocation(clientIp);
    logger.error(
      ` unauthorized log in at ${new Date().toISOString()} - ${res.status} - ${
        res.statusMessage
      } - ${req.originalUrl} - ${req.method} - ${req.ip} - ${
        req.session.id
      } - with IP: ${req.clientIp} from ${location}`
    );
  }

  if (!userName || !password) {
     res.status(406).json({
      error: "Fields cannot be empty",
      
    });
    const location = await getLocation(clientIp);
    logger.error(
      `user with id ${
        user._id
      } attempted to log in at ${new Date().toISOString()} - ${res.status} - ${
        res.statusMessage
      } - ${req.originalUrl} - ${req.method} - ${req.ip} - ${
        req.session.id
      } - with IP: ${req.clientIp} from ${location}`
    );
  }
  const user = await USER.findById(id);
  if (!user) {
    throw new Error("User does not exist");
  }

  if (bycrypt.compare(password, user.password)) {
    // Successful login
    // Reset the login attempts for this IP address
    loginAttempts.delete(clientIp);

    const token = generateToken(user._id); // Replace with your actual token

    res.status(200).header("Authorization", `Bearer ${token}`).json({
      message: "successful",
      token: token,
    });

    // Log successful login
    const location = await getLocation(clientIp);
    logger.info(
      `user with id ${user._id} logged in at ${new Date().toISOString()} - ${
        res.status
      } - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${
        req.ip
      } - ${req.session.id} - with IP: ${req.clientIp} from ${location}`
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

    res.status(401).json({
      error: "Invalid credentials",
    });

    const location = await getLocation(clientIp);
    logger.error(
      `user with id ${
        user._id
      } attempted to log in at ${new Date().toISOString()} - ${res.status} - ${
        res.statusMessage
      } - ${req.originalUrl} - ${req.method} - ${req.ip} - ${
        req.session.id
      } - with IP: ${req.clientIp} from ${location}`
    );
  }
});

//desc register users
//access public
//router /users/register
const register_users = asynchandler(async (req, res) => {
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
  const salt = await bycrypt.genSalt(10);
  const hashedpassword = await bycrypt.hash(password, salt);
  const createUsers = await USER.create({
    firstName,
    middleName,
    lastName,
    email,
    password: hashedpassword,
    userName,
    phoneNumber,
  });
  const location = await getLocation(clientIp)
  const token = generateToken(createUsers._id);
  if (createUsers) {
    res.status(202).json({
      status: "202",
      message: "user created ",
      token:token
    });
    logger.info(
      `user with id ${createUsers._id}, was created at ${createUsers.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${req.session.id} - from ${location}`
    );
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
const getLocation = asynchandler(async (ip) => {
  try {
    const response = await axios.get(`https://ipinfo.io/${ip}/json`);
    return response.data;
  } catch (error) {
    return null;
  }
});
module.exports = { register_users };
