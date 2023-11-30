const mongoose = require("mongoose");

const thread = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: [true, "please add a owner id"],
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CHAT",
      required: [true, "please add a owner id"],
    },
    owner_name: { type: String, required: [true, "please add a owner name"] },
 
    content: {
      type: String,
      required: [true, "please add a comment"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("THREAD", thread);
