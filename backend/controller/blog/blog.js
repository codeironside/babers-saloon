const asynchandler = require("express-async-handler");
const logger = require("../../utils/logger");
const USER = require("../../model/users/user.js");
const BLOG = require("../../model/blogs/blog.js");
const comment = require("../../model/blogs/comments.js");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//access privare
//route /shops/register/
// route for creating shops
const create_blog = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { blog_title, category, content, media_url } = req.body;
    if (!id) throw new Error("Not a user");
    if (!blog_title || !category || !content)
      throw new Error("body can not be empty");
    const exist = await BLOG.findOne({ blog_title: blog_title });
    const contentexist = await BLOG.findOne({ content: content });
    if (exist) throw new Error("title already exist");
    if (contentexist) throw new Error("content already exist");
    const user = await USER.findById(id);
    const blog = await BLOG.create({
      blog_title,
      owner_id: id,
      owner_name: user.userName,
      category,
      content,
      media_url,
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
      `User with id ${id} created a blog with id: ${blog._id} at ${blog.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
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
    if (!blog_id || !content) throw new Error("body can not be empty");
    const user = await USER.findById(id);
    const blog = await comment.create({
      blog_id,
      owner_id: id,
      owner_name: user.userName,
      content,
    });
    const Blogs = await BLOG.findById(blog_id);
    const comments = await comment.find({ blog_id: blog_id });

    const commentsCount = comments.length;
    const token = generateToken(id);
    res
      .status(200)
      .header("Authorization", `Bearer ${token}`)
      .json({ Blogs, comments, commentsCount });
    logger.info(
      `User with id ${id} created a commen with id: ${blog._id} at ${blog.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
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
      let blogsArray = [];

      for (const blog of blogs) {
        const comments = await comment.find({ blog_id: blog._id });
        blog.comments = comments;
        blogsArray.push(blog);
      }

      const totalCount = await BLOG.countDocuments();
      const totalPages = Math.ceil(totalCount / pageSize);

      const token = generateToken(id);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        data: blogsArray,
        page: page,
        totalPages: totalPages,
      });

      logger.info(
        `Blogs were fetched by admin with id:${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
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

      let blogDict = [];

      for (const blog of blogs) {
          let blogObject = blog.toObject(); // Convert Mongoose object to plain object
          const comments = await comment.find({ blog_id: blog._id.toString() });
          blogObject.comments = comments; // Add comments to the blog object
          blogDict.push(blogObject); // Push the blog object to the array
      }
      
      const totalCount = await BLOG.countDocuments({ owner: id });
      const totalPages = Math.ceil(totalCount / pageSize);
      const token = generateToken(id);
      
      res.status(200).header("Authorization", `Bearer ${token}`).json({
          data: blogDict,
          page: page,
          totalPages: totalPages,
      });
      
    logger.info(
      `user with id ${id}, fetched all his blogs - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip} `
    );
  } catch (error) {
    console.log(error);
    throw new Error(`${error}`);
  }
});
//desc get one blog
//acess private
//rouyte
const getblog = asynchandler(async (req, res) => {
  const { blog_id } = req.body;
  const { id } = req.auth; // Assuming you are passing userId as a route parameter

  try {
    if (!id) throw new Error("Not a user");

    const blogs = await BLOG.findById(blog_id);
    let owner = false
    if(id === blogs.owner_id){
      owner = true
      const reviews = await comment.find({ blog_id: blogs._id });
      let dict = [];
      dict.comment= reviews;
  
      
      const token = generateToken(id);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        data: dict,
      });
      logger.info(
        `user with id ${id}, fetched a blog with id ${blogs._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location} `
      );
    }else{
      const reviews = await comment.find({ blog_id: blogs._id });
      let dict = [];
      dict.comment= reviews;
  
      
      const token = generateToken(id);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        data: dict,
      });
      logger.info(
        `user with id ${id}, fetched a blog with id ${blogs._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location} `
      );
    }
 
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
    const { blog_id } = req.params;
    const { status } = req.body;
    const role = await USER.findById(id);
    if (!(role._role === "superadmin" || process.env.role === "superadmin"))
      throw new Error("not authorized");
    const updatedUser = await BLOG.findByIdAndUpdate(
      blog_id,
      { $set: { approved: status } },
      { new: true }
    );

    if (!updatedUser || updatedUser.blog_owner === false) {
      throw new Error("User not found or blog_owner is already false");
    }

    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
success:true
    });

    logger.info(
      `admin with id ${id}, updated blog with id ${blog_id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${location} `
    );
  } catch (error) {
    console.error("Error updating blog_owner:", error.message);
    throw new Error(`${error}`);
  }
});
const searchBlogs = asynchandler(async (req, res) => {
  const query = req.query.query;
  try {
    const blogResults = await BLOG.find({ $text: { $search: query } }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      data: blogResults,
    });

    logger.info(
      `Blog search results fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${lreq.ip}`
    );
  } catch (error) {
    console.error(error);
    throw new Error(`${error}`);
  }
});
const getall = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  try {
    owner = false;
    const totalCount = await BLOG.countDocuments();
    const totalPages = Math.ceil(totalCount / pageSize);
    const shops = await BLOG.find()
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.status(200).json({
      owner: owner,
      data: shops,
      page: page,
      totalPages: totalPages,
    });

    logger.info(
      `blogs were fetched  - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    );
  } catch (error) {
    console.log(error);
    throw new Error(`${error}`);
  }
});
// access private
// desc list all shops
// route /shops/al

const blogs = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const { id } = req.auth;
  try {
    const user = await USER.findById(id);
    if (
      !(
        user.role === "superadmin" ||
        process.env.role.toString() === "superadmin"
      )
    ) {
      throw new Error("not authorized");
    }
    let owner = false;
    const shop = await BLOG.findOne({ owner: id });
    if ((id === shop.owner, toString())) {
      const token = generateToken(shop._id);
      owner = true;
      const totalCount = await BLOG.countDocuments();
      const totalPages = Math.ceil(totalCount / pageSize);
      const shops = await BLOG.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        owner: owner,
        data: shops,
        page: page,
        totalPages: totalPages,
      });
      logger.info(
        `blogs were fetched by${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    } else {
      const token = generateToken(shop._id);
      const totalCount = await BLOG.countDocuments();
      const totalPages = Math.ceil(totalCount / pageSize);
      const shops = await BLOG.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        owner: owner,
        data: shops,
        page: page,
        totalPages: totalPages,
      });
      logger.info(
        `blogs were fetched by${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    }
  } catch (error) {
    console.log(error);
    throw new Error(`${error}`);
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
  create_blog,
  create_comment,
  updateBlogOwner,
  getallblogs,
  getallblogsowner,
  getblog,
  getall,
  searchBlogs,
  blogs
};