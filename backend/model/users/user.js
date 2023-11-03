const mongoose = require("mongoose");
const USERS = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "please add a first name "],
    },
    middleName: {
      type: String,
    },
    lastName: {
      type: String,
      required: [true, "please add a last name "],
    },
    userName: {
      type: String,
      required: [true, "please add a user name "],
      unique: true,
      uniqueCaseInsensitive:
        "Username must be unique. This username already exists.",
    },
    email: {
      type: String,
      required: [true, "please add an email "],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "please add a password "],
    },
    role: {
      type: String,
      required: [true, "please specify a role"],
      default: "USER",
    },
    banned_from_forum: {
      type: Boolean,
      default: false,
    },
    referCode: {
      type: String,
    },
    referredBy: {
      type: String,
    },
  pictureUrl:{type:String}
  },

  {
    timestamps: true,
  }
);
module.exports = mongoose.model("USER", USERS);
