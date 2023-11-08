const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { createSubscription, adminsubscibtionpanel, getalluserssubscibtion, updateSubscriptionPlan } = require('../controller/payment/payment.controller')

//access private
Router.route('/register').post(protect,createSubscription )
//ccess privare
Router.route("/getall").get(protect,adminsubscibtionpanel)
//ccess private
Router.route("/getone").get(protect,getalluserssubscibtion)


//access private
Router.route('/updateS/:vendor').put(protect, updateSubscriptionPlan)
//access private

module.exports= Router