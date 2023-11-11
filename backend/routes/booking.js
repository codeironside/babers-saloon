const express = require('express')
const Router= express.Router()
const {protect} = require('../middleware/authmiddleware')
const { makebooking, updateBooking, getAllBookingsForAdmins,getAllBookingsForVendor } = require('../controller/payment/booking.contoller')

// //access private
Router.route('/create').post(protect,makebooking)
// //ccess privare
Router.route("/getall").get(protect,getAllBookingsForAdmins)
// //ccess private
Router.route("/getone").get(protect,getAllBookingsForVendor)


// //access private
Router.route('/updatebooking/:bookingId').put(protect, updateBooking)
//access private

module.exports= Router