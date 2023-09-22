const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const USER = require("../model/user");
const logger = require("../utils/logger")
const register_users = asynchandler(async (req, res) => {
  const { firstName, middleName, lastName, email, password } = req.body;
  if (!firstName || !middleName || !lastName || !email || !password) {
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
  });
  const token =generateToken(createUsers._id)
  if (createUsers) {
    res.status(202).json({
      status: "202",
      message: "user created ",
    });
    logger.info(`user with id ${createUsers._id}, was created at ${createUsers.createdAt} - ${res.status} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${req.session.id}`)
  }
});
const generateToken = (id) => {
    return jwt.sign(
      {
        id
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
  };
  

module.exports = {register_users}
