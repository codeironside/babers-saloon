const express = require("express")


const { protect } = require("../middleware/authmiddleware")
const { register_users,confirmEmail, login_users,updateUser, oneUser,getUser,landingpage, getallusers, forum_status,searchItems, landing_page,changePassword,logout_user } = require("../controller/users/users.controller")
const Router = express.Router()



//register users
Router.route("/register").post(register_users)
//login users 
Router.route("/login").post(login_users)
//update users
Router.route('/update/:userId').put(protect, updateUser)
//update users
Router.route('/updatefor/:userId').put(protect, forum_status)
//update users
Router.route('/updatepass/:userId').put(protect, changePassword)
//get one user
Router.route('/getone').get(protect,getUser)

Router.route('/one').get(protect,oneUser)
//access private
Router.route('/users').get(protect, landing_page)
//access public
Router.route('/home').get(landingpage)
//access public
//search
Router.route('/search').get(searchItems)
//get all yses
Router.route('/getall').get(protect,getallusers)
//update a user
Router.route('/logout').get(protect,logout_user)
//confirm mail
Router.route("/mail").get(confirmEmail)
 
module.exports=Router