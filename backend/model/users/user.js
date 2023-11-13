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
    blog_owner: { type: Boolean, default: false },
    banned_from_forum: {
      type: Boolean,
      default: false,
    },
    referCode: {
      type: String,
      unique:true
    },
    referredBy: {
      type: String,
    },
    type:{
      type:String,
      default:'basic',
    },
    pictureUrl: { type: String },
  },

  {
    timestamps: true,
  }
);
module.exports = mongoose.model("USER", USERS);
