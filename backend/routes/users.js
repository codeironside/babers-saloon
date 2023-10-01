const express = require("express")


const { protect } = require("../middleware/authmiddleware")
const { register_users, login_users } = require("../controller/users/users.controller")
const Router = express.Router()



//register users
Router.route("/register").post(register_users)
//login users 
Router.route("/login").post(login_users)

module.exports=Router