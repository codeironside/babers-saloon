const mongoose = require("mongoose");
const USERS = mongoose.Schema(
  {
   
    firstName:{
      type: String,
      required: [true, "please add a first name "],

    },
     middleName:{
      type: String,

      
    },
   lastName: {
    type: String,
    required: [true, "please add a last name "],

    },
    email: {
      type: String,
      required: [true, "please add an email "],
      unique:true
    },
    password:{
      type: String,
      required: [true, "please add a password "],
     
    }
   
  },

  {
    timestamps: true,
  }
);
module.exports = mongoose.model("USER", USERS);
