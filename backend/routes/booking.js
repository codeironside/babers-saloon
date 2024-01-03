const express = require("express");
const Router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
  makebooking,
  updateBooking,
  getAllBookingsForAdmins,
  getAllBookingsForUser,
  getAllBookingsForVendor,
  confirmDelivery,
} = require("../controller/payment/booking.contoller");

//access private
Router.route("/create/:shop_id ").post(protect, makebooking);
//ccess privare
Router.route("/getall").get(protect, getAllBookingsForAdmins);
//ccess private

Router.route("/getone/:vendorId").get(protect, getAllBookingsForVendor);
Router.route("/user").get(protect, getAllBookingsForUser);

//access private
Router.route("/updatebooking/:bookingId").put(protect, updateBooking);
//access private
Router.route("/confirm-delivery/:bookId").put(protect, confirmDelivery);
module.exports = Router;
