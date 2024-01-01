const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { create_shops, getallshops, updateShops, getallshopone, login_shops, updateWorkingHours,updateapproval, updatesubscription,searchShops,getshop,getall, updateavalability, updateServices,consentToUserAgreement } = require('../controller/shops/shops.controller')

//access private
Router.route('/register').post(protect,create_shops )
//ccess privare
Router.route("/getall").get(protect,getallshops)
//ccess public
Router.route("/all").get(getall)
//acess private for a guesst
Router.route('/login/:SHOP_ID').get(login_shops)
//access public
Router.route('/search').get(searchShops)

//access private
Router.route('/updateS/:shopId').put(protect, updateShops)
//access private
Router.route('/getallone').get(protect, getallshopone)
//access private for users and shop owners
Router.route('/getone/:SHOP_ID').get(protect, getshop)


//access private
Router.route('/updateH/:shopId').put(protect, updateWorkingHours)

//access private
Router.route('/updatesub/:shopId').put(protect, updatesubscription)
//access public
Router.route('/updateavb/:shopId').put(protect, updateavalability)
//access private
Router.route('/updateapp/:shopId').put(protect, updateapproval)
//access private
Router.route('/updateserices/:shopId').put(protect, updateServices)
Router.route('/consent/:shopId').put(protect, consentToUserAgreement)
module.exports= Router