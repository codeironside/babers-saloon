const express = require("express")
const { protect } = require("../middleware/authmiddleware")
const {chatlogic} = require("../controller/chatroom/chat.controller")
const Router = express.Router()



//register users
Router.route("/send-message").post(protect, chatlogic)


module.exports=Router