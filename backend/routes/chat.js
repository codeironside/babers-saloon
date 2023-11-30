const express = require("express")
const { protect } = require("../middleware/authmiddleware")
const {chatlogic,getOneChat, threads, getallchats, deletechat} = require("../controller/chatroom/chat.controller")
const Router = express.Router()



//send message
Router.route("/send-message").post(protect, chatlogic)
//get all
Router.route("/getall").get(protect, getallchats)
Router.route("/getone/:chatId").get(protect, getOneChat)
//access private
Router.route("/delete/:chatId").delete(protect, deletechat)
Router.route("/thread/:chatId").post(protect, threads)


module.exports=Router