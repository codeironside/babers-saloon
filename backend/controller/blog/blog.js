const asynchandler = require("express-async-handler");
const logger = require("../../utils/logger");
const USER = require("../../model/users/user.js");
const BLOG = require("../../model/blog/blog.js");
const comment = require("../../model/blog/comment.js");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//access privare
//route /shops/register/
// route for creating shops
const create_blog = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { blog_title, category, content } = req.body;
    if (!id) throw new Error("Not a user");
    if (!blog_title || !category || !content)
      throw new Error("body can not be empty");
    const exist = await BLOG.findOne({blog_title:blog_title})
    if(exist) throw new Error('title already exist')
    const user = await USER.findById(id);
    const blog = await BLOG.create({
      blog_title,
      owner_id: id,
      owner_name: user.userName,
      category,
      content,
    });
    const comments = await comment.find({ blog_id: blog._id });
    const commentsCount = comments.length;
    const updateuser = await USER.findByIdAndUpdate(
      id,
      { $set: { blog_owner: true } },
      { new: true }
    );
    if (!updateuser) throw new Error("user not updated");
    const token = generateToken(id);
    res
      .status(200)
      .header("Authorization", `Bearer ${token}`)
      .json({ blog, comments, commentsCount });
    logger.info(
      `User with id ${id} created a blog with id: ${blog._id} at ${blog.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
    );
  } catch (error) {
    console.error(error);
    throw new Error(`${error}`);
  }
});
//access privare
//route /shops/register/
// route for creating shops
const create_comment = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { blog_id, content } = req.body;
    if (!id) throw new Error("Not a user");
    if (!blog_id ||!content)
      throw new Error("body can not be empty");
    const user = await USER.findById(id);
    const blog = await comment.create({
      blog_id,
      owner_id: id,
      owner_name: user.userName,
      content,
    });
    const Blogs = await BLOG.findById(blog_id)
    const comments = await comment.find({ blog_id: blog._id });
    const commentsCount = comments.length;
    const token = generateToken(id);
    res
      .status(200)
      .header("Authorization", `Bearer ${token}`)
      .json({ Blogs, comments, commentsCount });
    logger.info(
      `User with id ${id} created a blog with id: ${blog._id} at ${blog.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
    );
  } catch (error) {
    console.error(error);
    throw new Error(`${error}`);
  }
});

// access private
// desc list all blogs for admin
// route /shops/al

const getallblogs = asynchandler(async (req, res) => {
  const { id } = req.auth;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
 
  try {
    const user = await USER.findById(id);
    if (user._role === "superadmin" || process.env.role === "superadmin") {
      if (!id) throw new Error("Not a user");

      const blogs = await BLOG.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort({ createdAt: -1 });

      for (const blog of blogs) {
        const comments = await comment.find({ blog_id: blog._id });
        blog.comments = comments;
      }

      const totalCount = await BLOG.countDocuments();
      const totalPages = Math.ceil(totalCount / pageSize);

      const token = generateToken(id);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        data: blogs,
        page: page,
        totalPages: totalPages,
      });

      logger.info(
        `Blogs were fetched ${currentTime} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location}`
      );
    } else {
      throw new Error("user  not authorized");
    }
  } catch (error) {
    console.log(error);
    throw new Error(`${error}`);
  }
});

//desc get blog owners blog
//acess private
//rouyte
const getallblogsowner = asynchandler(async (req, res) => {
  let page = parseInt(req.query.page) || 1;

  const pageSize = parseInt(req.query.pageSize) || 10;
  const { id } = req.auth; // Assuming you are passing userId as a route parameter

  try {
    if (!id) throw new Error("Not a user");

    const blogs = await BLOG.find({ owner_id: id })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    for (const blog of blogs) {
      const reviews = await comment.find({ blog_id: shop._id });
      shop.reviews = reviews;
    }

    const totalCount = await BLOG.countDocuments({ owner: id });
    const totalPages = Math.ceil(totalCount / pageSize);

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const currentTime = `${hours}:${minutes}:${seconds}`;
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: shops,
      page: page,
      totalPages: totalPages,
    });
    logger.info(
      `user with id ${id}, fetched all his products - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location} `
    );
  } catch (error) {
    console.log(error);
    throw new Error(`${error}`);
  }
});
//update blogowner
//access private
const updateBlogOwner = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
    const { blog_id, status } = req.auth;
    const role = await USER.findById(id);
    if (!(role._role === "superadmin") || !(process.env.role === "superadmin"))
      throw new Error("not authorized");
    const updatedUser = await BLOG.findByIdAndUpdate(
      blog_id,
      { $set: { approved: status } },
      { new: true }
    );

    if (!updatedUser || updatedUser.blog_owner === false) {
      throw new Error("User not found or blog_owner is already false");
    }
    const blogs = await BLOG.find()
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .sort({ createdAt: -1 });

  for (const blog of blogs) {
    const comments = await comment.find({ blog_id: blog._id });
    blog.comments = comments;
  }

  const totalCount = await BLOG.countDocuments();
  const totalPages = Math.ceil(totalCount / pageSize);

  const token = generateToken(id);
  res.status(200).header("Authorization", `Bearer ${token}`).json({
    data: blogs,
    page: page,
    totalPages: totalPages,
  });
    
    logger.info(
      `admin with id ${id}, updated blog with id ${blog_id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location} `
    );
  } catch (error) {
    console.error("Error updating blog_owner:", error.message);
    throw new Error("Server Error");
  }
});
const getLocation = asynchandler(async (ip) => {
  try {
    // Set endpoint and your access key
    const accessKey = process.env.ip_secret_key;
    const url =
      "http://apiip.net/api/check?ip=" + ip + "&accessKey=" + accessKey;

    // Make a request and store the response
    const response = await fetch(url);

    // Decode JSON response:
    const result = await response.json();

    // Output the "code" value inside "currency" object
    return response.data;
  } catch (error) {
    console.log(error);
    return null;
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
module.exports = {
  create_shops,
  getallshops,
  updateShops,
  login_shops,
  getallshopone,
  updateWorkingHours,
};
