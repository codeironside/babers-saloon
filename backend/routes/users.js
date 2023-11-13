const express = require("express")


const { protect } = require("../middleware/authmiddleware")
const { register_users, login_users,updateUser, getUser, getallusers, forum_status,searchItems, landing_page } = require("../controller/users/users.controller")
const Router = express.Router()



//register users
Router.route("/register").post(register_users)
//login users 
Router.route("/login").post(login_users)
//update users
Router.route('/update/:userId').put(protect, updateUser)
//update usersn
Router.route('/updatefor/:userId').put(protect, forum_status)
//get one user
Router.route('/getone').get(protect,getUser)
//access publiv
Router.route('/home').get(landing_page)
//access public
//search
Router.route('/search').get(searchItems)
//get all yses
Router.route('/getall').get(protect,getallusers)
 
module.exports=Router