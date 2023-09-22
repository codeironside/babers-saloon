const express = require("express")


const { protect } = require("../middleware/authmiddleware")
const { register_users } = require("../controller/users")
const Router = express.Router()




Router.route("/register").post(register_users)

module.exports=Router