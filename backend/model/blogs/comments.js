const mongoose = require("mongoose");

const COMMENT = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: [true, "please add a owner id"],
    },
    blog_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BLOG",
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

module.exports = mongoose.model("COMMENT", COMMENT);
