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


/**
 * @async
 * @function makebooking
 * @description This function is used to make a booking for a barber shop service.
 * @param {Object} req - The request object from the client. It should contain:
 *   - auth: An object that contains the user's ID.
 *   - body: An object that contains the booking details such as service, date, number of persons, time, and shop ID.
 * @param {Object} res - The response object that will be sent to the client.
 * @throws {Error} Will throw an error if the user ID is not provided, or if the user or shop is not found in the database, or if the shop's category is not "barbers".
 * @returns {Object} If successful, it will return a JSON response with the booking data.
 */
const makebooking = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { service, date, no_persons, time} = req.body;
    const { shop_id }= req.params
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

/**
 * @async
 * @function updateBooking
 * @description This function is used to update a booking for a barber shop service.
 * @param {Object} req - The request object from the client. It should contain:
 *   - auth: An object that contains the user's ID.
 *   - params: An object that contains the booking ID.
 *   - body: An object that contains the updated booking details such as service, date, number of persons, and time.
 * @param {Object} res - The response object that will be sent to the client.
 * @throws {Error} Will throw an error if the user ID does not match the user ID in the booking, or if the booking ID is not provided, or if the booking is not found or not updated in the database.
 * @returns {Object} If successful, it will return a JSON response with the updated booking data.
 */
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
/**
 * @async
 * @function getAllBookingsForAdmins
 * @description This function is used to retrieve all bookings for administrators.
 * @param {Object} req - The request object from the client. It should contain:
 *   - auth: An object that contains the user's ID.
 * @param {Object} res - The response object that will be sent to the client.
 * @throws {Error} Will throw an error if the user's role is not "superadmin".
 * @returns {Object} If successful, it will return a JSON response with all the bookings data.
 */

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



/**
 * @async
 * @function getAllBookingsForVendor
 * @description This function is used to retrieve all bookings for a specific vendor.
 * @param {Object} req - The request object from the client. It should contain:
 *   - auth: An object that contains the user's ID.
 *   - params: An object that contains the vendor's ID.
 * @param {Object} res - The response object that will be sent to the client.
 * @throws {Error} Will throw an error if the user's ID does not match the shop owner's ID and the user's role is not "superadmin".
 * @returns {Object} If successful, it will return a JSON response with all the bookings data for the specific vendor.
 */
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

/**
 * @async
 * @function getAllBookingsForUser
 * @description This function is used to retrieve all bookings for a specific user.
 * @param {Object} req - The request object from the client. It should contain:
 *   - auth: An object that contains the user's ID.
 * @param {Object} res - The response object that will be sent to the client.
 * @throws {Error} Will throw an error if the user's ID does not match the user's ID in the database and the user's role is not "superadmin".
 * @returns {Object} If successful, it will return a JSON response with all the bookings data for the specific user.
 */

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
const confirmDelivery = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { bookId } = req.params;
    if (!id) throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    const books = await booking.findById(bookId)
    if(id !== books.user.toString()){
      throw Object.assign(new Error("not authorized"), { statusCode: 403 })
    }
    const book = await booking.findByIdAndUpdate(bookId, { delivered: true }, { new: true });
    if (!book) {
      throw Object.assign(new Error("Product not found"), { statusCode: 404 });
    }
    
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: book,
    });
    logger.info(
      `Product delivery confirmed by ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} `
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

const confirmedpayment= asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { bookId } = req.params;
    if (!id) throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    const books = await booking.findById(bookId)
    if(id !== books.user.toString()){
      throw Object.assign(new Error("not authorized"), { statusCode: 403 })
    }
    const book = await booking.findByIdAndUpdate(bookId, { paid: true }, { new: true });
    if (!book) {
      throw Object.assign(new Error("Product not found"), { statusCode: 404 });
    }
    
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      book,
    });
    logger.info(
      `Product delivery confirmed by ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} `
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
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
  confirmDelivery,
  confirmedpayment
};
