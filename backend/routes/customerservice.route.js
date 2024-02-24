const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { getMessages, sendMessage}= require('../controller/customerservice/conversation')


Router.route('/sendMessages/:firstid').post(protect,sendMessage)
//ccess privare
Router.route("/getMessages/:firstid").get(protect,getMessages)
module.exports= Router