const mongoose = require("mongoose");

const reply = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: [true, "please add a owner id"],
    },
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CHAT",
      required: [true, "please add a owner id"],
    },
    userName: { type: String, required: [true, "please add a owner name"] },
 
    content: {
      type: String,
      required: [true, "please add a comment"],
    },
    image:{
      type :String,
      required:[true,'please add a owner name'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("reply", reply);
