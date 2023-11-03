const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { create_shops, getallshops, updateShops, getallshopone, login_shops, updateWorkingHours,updateapproval, updatesubscription,searchShops } = require('../controller/shops/shops.controller')

//access private
Router.route('/register').post(protect,create_shops )
//ccess privare
Router.route("/getall").get(protect,getallshops)
//acess private
Router.route('/login').get(protect, login_shops)
//access public
Router.route('/search').get(searchShops)

//access private
Router.route('/updateS/:shopId').put(protect, updateShops)
//access private
Router.route('/getallone').get(protect, getallshopone)


//access private
Router.route('/updateH/:shopId').put(protect, updateWorkingHours)

//access private
Router.route('/updatesub/:shopId').put(protect, updatesubscription)
//access private
Router.route('/updateapp/:shopId').put(protect, updateapproval)
module.exports= Router