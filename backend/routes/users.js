const express = require("express")


const { protect } = require("../middleware/authmiddleware")
const { register_users, login_users,updateUser, getUser,landingpage, getallusers, forum_status,searchItems, landing_page } = require("../controller/users/users.controller")
const Router = express.Router()



//register users
Router.route("/register").post(register_users)
//login users 
Router.route("/login").post(login_users)
//update users
Router.route('/update/:userId').put(protect, updateUser)
//update users
Router.route('/updatefor/:userId').put(protect, forum_status)
//get one user
Router.route('/getone').get(protect,getUser)
//access private
Router.route('/users').get(protect, landing_page)
//access public
Router.route('/home').get(landingpage)
//access public
//search
Router.route('/search').get(searchItems)
//get all yses
Router.route('/getall').get(protect,getallusers)
 
module.exports=Router