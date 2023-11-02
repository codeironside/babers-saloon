const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { create_shops, getallshops } = require('../controller/shops/shops.controller')

//access private
Router.route('/register').post(protect,create_shops )
//ccess public
Router.route("/getall").get(getallshops)
module.exports= Router