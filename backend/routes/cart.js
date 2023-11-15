const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { makecart, updateCart, getAllCartsForVendor, getAllcartForAdmins, getAllcartsForuser } = require('../controller/payment/cart.controller')

//access private
Router.route('/create').post(protect,makecart)
//ccess privare
Router.route("/getall").get(protect,getAllcartForAdmins)
//ccess private

Router.route("/getone/:vendorId").get(protect,getAllCartsForVendor)
Router.route("/user").get(protect,getAllcartsForuser)

//access private
Router.route('/updatebooking/:cartId').put(protect, updateCart)
//access private

module.exports= Router