const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { createSubscription, adminSubscriptionPanel, getAllUsersSubscription, updateSubscriptionPlan } = require('../controller/payment/subscribtion.controller')

//access private
Router.route('/register').post(protect,createSubscription )
//ccess privare
Router.route("/getall").get(protect,adminSubscriptionPanel)
//ccess private
Router.route("/getone").get(protect,getAllUsersSubscription)


//access private
Router.route('/updateplan/:planId').put(protect, updateSubscriptionPlan)
//access private

module.exports= Router