const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { paidproduct, getPaymentsforadmin, getPaymentsforuser,getPaymentsforvendor } = require('../controller/payment/payment.controller')

//access private
Router.route('/pay').post(protect,paidproduct )
//ccess privare
Router.route("/admin").get(protect, getPaymentsforadmin)
//ccess private
Router.route("/user").get(protect,getPaymentsforuser)
//ccess private
Router.route("/vendor").get(protect,getPaymentsforvendor)





module.exports= Router