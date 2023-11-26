const mongoose = require("mongoose");

const BLOG = new mongoose.Schema(
  {
    blog_title: {
      type: String,
      required: [true, "please add a blog title"]
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
    media_url: {
      type: String,
    },
    content: {
      type: String,
      required: [true, "please add a content"]
    },
    reading_time: {
      type: String,
      required: [true, "please add a reading time"],
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
BLOG.index({ blog_title: 'text' });

const BlogModel = mongoose.model("BLOG", BLOG);

BlogModel.ensureIndexes();

module.exports = BlogModel;