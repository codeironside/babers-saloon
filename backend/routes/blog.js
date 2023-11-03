const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { create_shops, getallshops, updateShops, getallshopone, login_shops, updateWorkingHours } = require('../controller/shops/shops.controller')

//access private
Router.route('/register').post(protect,create_shops )
//ccess public
Router.route("/getall").get(getallshops)
//acess private
Router.route('/login').get(protect, login_shops)

//access private
Router.route('/updateS/:shopId').put(protect, updateShops)
//access private
Router.route('/getallone').get(protect, getallshopone)

//access private
Router.route('/updateH/:shopId').put(protect, updateWorkingHours)
module.exports= Router