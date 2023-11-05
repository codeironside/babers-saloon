const express = require("express")
const { protect } = require("../middleware/authmiddleware")
const {chatlogic, getallchats, deletechat} = require("../controller/chatroom/chat.controller")
const Router = express.Router()



//send message
Router.route("/send-message").post(protect, chatlogic)
//get all
Router.route("/getall").get(protect, getallchats)
//access private
Router.route("/delete/:chatId").delete(protect, deletechat)


module.exports=Router