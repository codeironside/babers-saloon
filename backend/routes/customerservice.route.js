const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { getMessages, sendMessages}= require('../controller/customerservice/conversation')



module.exports= Router