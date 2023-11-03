const mongoose = require("mongoose");

const BLOG = new mongoose.Schema(
  {
    blog_title: {
      type: String,
      required: [true, "please add a blog title"],
      unique: true,
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: [true, "please add a owner id"],
    },

    owner_name: { type: String, required: [true, "please add a owner name"] },
    category: {
      type: String,
      required: [true, "please add a category"],
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "please add a content"],
      ref: "USER",
    },
    approved :{
      type:Boolean,
      default:false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BLOG", BLOG);
