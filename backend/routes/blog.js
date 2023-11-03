const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const {   create_blog,
    create_comment,
    updateBlogOwner,
    getallblogs,
    getallblogsowner,
    getblog,searchBlogs} = require('../controller/blog/blog')

//access private
Router.route('/create').post(protect,create_blog )
//acess private
Router.route('/createcomment').post(protect,create_comment)
//ccess private
Router.route("/getall").get(protect,getallblogs)
//acess private
Router.route("/getblog").get(protect,getallblogsowner)

//access private
Router.route('/getone').get(protect, getblog)
//access public
Router.route('/search').get(searchBlogs)

//access private
Router.route('/updateblog/:blog_id').put(protect, updateBlogOwner,)
module.exports= Router