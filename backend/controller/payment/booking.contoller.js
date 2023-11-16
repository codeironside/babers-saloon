const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const USER = require("../../model/users/user");
const SHOPS = require("../../model/shops/shop");
const logger = require("../../utils/logger");
const { DateTime } = require("luxon");
const { convertToWAT } = require("../../utils/datetime");
const Subscription = require("../../model/payment/subscription");
const booking = require("../../model/payment/booking");
const currentDateTimeWAT = DateTime.now().setZone("Africa/Lagos");

const makebooking = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { service, date, no_persons, time, shop_id } = req.body;
    if (!id) throw Object.assign(new Error("Not allowed"), { statusCode: 403 });
    const user = await USER.findById(id);
    if (!user)
      throw Object.assign(new Error("user not found"), { statusCode: 404 });
    const shop = await SHOPS.findById(shop_id);
    if (!shop_id)
      throw Object.assign(new Error("shop not found"), { statusCode: 404 });
    if (shop.category !== "barbers")
      throw Object.assign(new Error("Booking is reserved for only barbnoers"), {
        statusCode: 403,
      });
    let n = Number(no_persons) * shop.price;
    const book = await booking.create({
      user: user._id,
      shop: shop._id,
      service,
      time,
      date: new Date(date),
      no_persons: Number(no_persons),
      amount: n,
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
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

// Controller for updating a booking
const updateBooking = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { bookingId } = req.params;
    const { service, date, no_persons,time } = req.body;
    const book = await booking.findById(bookingId);
    
    if (!book)
      throw Object.assign(new Error("No current available"), {
        statusCode: 404,
      });
      const shop = await SHOPS.findOne({shop:book.shop})
    if (id.toString() !== book.user.toString())
    throw Object.assign(new Error("User cannot edit this schedule"), { statusCode: 403 });
    

    if (!bookingId) {
      throw Object.assign(new Error("Booking ID required"), { statusCode: 400 });
;
    }

    const updatedBooking = await booking.findByIdAndUpdate(
      bookingId,
      {
        $set: {
          service,
          date,
          time,
          no_persons:Number(no_persons),
          amount:Number(no_persons)*shop.price
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      throw Object.assign(new Error("booking not updated"), { statusCode: 500 });
;
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
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode });
;
  }
});
// Controller to get all bookings for admins
const getAllBookingsForAdmins = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (!(user.role === "superadmin" || process.env.role === "superadmin"))
      throw Object.assign(new Error("Not authorized"), { statusCode: 401 });

    let bookings = await booking.find()
      .populate({
        path: "user",
        model: "USER",
        select: "firstName email number address" 
      })
      .populate({
        path: "shop",
        model: "SHOPS", 
        select: "shop_name contact_email shop_address contact_number" 
      });

    const token = generateToken(id);

    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: bookings,
    });

    logger.info(
      `All bookings retrieved for admin - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode });
  }
});



// Controller to get all bookings for one vendor
const getAllBookingsForVendor = asynchandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { id } = req.auth;
    const shop = await SHOPS.findById(vendorId);
    if (id !== shop.owner.toString() && process.env.role.toString() !== "superadmin")
      throw Object.assign(new Error("Not authorized"), { statusCode: 401 });

    let bookings = await booking.find({ shop: shop._id })
      .populate({
        path: "user",
        model: "USER", 
        select: "firstName email number address" 
      })
      .populate({
        path: "shop",
        model: "SHOPS", // Adjust the model name based on your ShopsModel
        select: "shop_name contact_email shop_address contact_number" // Adjust these field names based on your SHOPS schema
      });

    const token = generateToken(id);

    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: bookings,
    });

    logger.info(
      `All bookings retrieved for vendor with ID: ${vendorId} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode });
  }
});


//bookings for users
const getAllBookingsForUser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (id !== user._id.toString() && process.env.role.toString() !== "superadmin")
      throw Object.assign(new Error("Not authorized"), { statusCode: 401 });

    let bookings = await booking.find({ user: user._id })
      .populate({
        path: "shop",
        model: "SHOPS", 
        select: "shop_name contact_email shop_address contact_number" 
      });

    const token = generateToken(id);

    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: bookings,
    });

    logger.info(
      `All bookings retrieved for user with ID: ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode });
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
module.exports = {
  makebooking,
  updateBooking,
  getAllBookingsForAdmins,
  getAllBookingsForUser,
  getAllBookingsForVendor,
};
