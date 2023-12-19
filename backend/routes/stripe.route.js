const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const {     subscriptionPayment,
    contributionPayment,
    cartPayment,
    bookingPayment,createPaymentIntent } = require('../controller/payment/stripe.controller')

//access private
Router.route('/subscription').post(protect,subscriptionPayment)
Router.route('/contribution').post(protect,contributionPayment)
Router.route('/cart').post(protect,cartPayment)
Router.route('/payment').post(protect,bookingPayment)
Router.route('/payment-intent').post(protect,createPaymentIntent)
 
module.exports= Router