const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { create_shops } = require('../controller/shops/shops.controller')

//access private
Router.route('/register').post(protect,create_shops )
module.exports= Router