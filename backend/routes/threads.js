const express = require("express")
const { protect } = require("../middleware/authmiddleware")
const {threadlogic,getOnethread,getallthread, comments,deletethread,getThreadWithComments,updateThread } = require("../controller/chatroom/thread.controller")
const Router = express.Router()



//send message
Router.route("/create-thread").post(protect, threadlogic)
//get all
Router.route("/getall").get(protect, getallthread)
Router.route("/getone/:query").get(protect, getOnethread)
Router.route("/one/:threadId").get(protect, getThreadWithComments)
Router.route("/update/:threadId").put(protect, updateThread)
//access private
Router.route("/delete/:threadId").delete(protect, deletethread)
Router.route("/thread/:threadId").post(protect, comments)


module.exports=Router