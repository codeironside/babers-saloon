const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const {   create_blog,
    create_comment,
    updateBlogOwner,
    getallblogs,
    getall,
    getallblogsowner,blogs,
    getblog,searchBlogs} = require('../controller/blog/blog')

//access private
Router.route('/create').post(protect,create_blog )
//acess private
Router.route('/createcomment').post(protect,create_comment)
//ccess private
Router.route("/getall").get(protect,getallblogs)

//access public
Router.route("/all").get(getall)

//access private
Router.route("/blogs").get(protect, blogs)
//acess private
Router.route("/getblog").get(protect,getallblogsowner)

//access private
Router.route('/getone/:blog_id').get(protect, getblog)
//access public
Router.route('/search').get(searchBlogs)

//access private
Router.route('/updateblog/:blog_id').put(protect, updateBlogOwner,)
module.exports= Router