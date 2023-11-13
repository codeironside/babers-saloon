const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const USER = require("../../model/users/user");
const SHOPS = require("../../model/shops/shop");
const logger = require("../../utils/logger");
const { DateTime } = require("luxon");
const { convertToWAT } = require("../../utils/datetime");
const Subscription = require("../../model/payment/subscription");
const booking = require("../../model/payment/subscription");
const currentDateTimeWAT = DateTime.now().setZone("Africa/Lagos");

const makebooking = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { service, date, time, shop_id } = req.body;
    if (!id) throw new Error("not allowed");
    const user = await USER.findById(id);
    if (!user) throw new Error("user not found");
    const shop = await SHOPS.findById(shop_id);
    if (!shop_id) throw new Error("shop not found");
    if (shop.category !== "barbers")
      throw new Error("booking is reserved for only barbers");
    const book = await booking.create({
      user: user._id,
      shop: shop._id,
      shop_name: shop.shop_name,
      service,
      user_userName: user.userName,
      time,
      date,
    });
    if (book) {
      const token = generateToken(user._id);
      res.status(201).header("Authorization", `Bearer ${token}`).json({
        successful: true,
        data: book,
      });
      logger.info(
        `user with id: ${id} booked for a service${service} from vendor with id ${shop.shop._id}, and name:${shop.shop_name} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    }
  } catch (error) {
    throw new Error(`${error}`);
  }
});

// Controller for updating a booking
const updateBooking = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { bookingId } = req.params;
    const { service, date, time } = req.body;
    const book = await booking.findById(bookingId);
    if (!book) throw new Error("no current booking available");

    if (id.toString() !== book.user.toString())
      throw new Error("user can not edit this schedule");

    if (!bookingId) {
      throw new Error("bookingid is required");
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          service,
          date,
          time,
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      throw new Error("booking not found");
    }
    const token = generateToken(id);

    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: updatedBooking,
    });

    logger.info(
      `Booking with ID: ${bookingId} updated by user with ID ${req.auth.id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw new Error(`${error}`);
  }
});
// Controller to get all bookings for admins
const getAllBookingsForAdmins = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (!(user.role === "superadmin" || process.env.role === "superadmin"))
      throw new Error("not authorized");
    const bookings = await Booking.find();
    const token = generateToken(id);
    res.status(200).header("Authoriation", `Bearer ${token}`).json({
      status: "success",
      data: bookings,
    });

    logger.info(
      `All bookings retrieved for admin - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw new Error(`${error}`);
  }
});

// Controller to get all bookings for one vendor
const getAllBookingsForVendor = asynchandler(async (req, res) => {
    try {
      const { vendorId } = req.params;
  const {id}=req.auth
  const Shop = await SHOPS.findById(vendorId)
  if(id!==shop.owner||process.env.role.toString()!=='superadmin') throw new Error('nor authorized')
      const bookings = await Booking.find({ shop: Shop._id })
    const token = generateToken(id)
      res.status(200).header("Authorization",`Bearer ${token}`).json({
        status: 'success',
        data: bookings,
      });
  
      logger.info(
        `All bookings retrieved for vendor with ID: ${vendorId} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    } catch (error) {
      throw new Error(`${error}`);
    }
  });
  const getLocation = asynchandler(async (ip) => {
    try {
      // Set endpoint and your access key
      const accessKey = process.env.ip_secret_key;
      const url =
        "http://apiip.net/api/check?ip=" + ip + "&accessKey=" + accessKey;
  
      // Make a request and store the response
      const response = await fetch(url);
  
      // Decode JSON response:
      const result = await response.json();
  
      // Output the "code" value inside "currency" object
      return response.data;
    } catch (error) {
      console.log(error);
      return null;
    }
  });
  
  const generateToken = (id) => {
    return jwt.sign(
      {
        id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );
  };
module.exports = { makebooking, updateBooking, getAllBookingsForAdmins,getAllBookingsForVendor };
