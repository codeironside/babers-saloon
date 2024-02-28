const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { getMessages,getAllMessagesForUser, sendMessage}= require('../controller/customerservice/conversation')


Router.route('/sendMessages/:firstid').post(protect,sendMessage)
//ccess privare
Router.route("/getMessages/:firstid").get(protect,getMessages)
//access private
Router.route("/oneUser").get(protect,getAllMessagesForUser)
module.exports= Router