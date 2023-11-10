const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const USER = require("../../model/users/user");
const SHOPS = require("../../model/shops/shop");
const COMMENT = require("../../model/blogs/comments");
const logger = require("../../utils/logger");
const { DateTime } = require("luxon");
const { convertToWAT } = require("../../utils/datetime");
const Subscription = require("../../model/payment/subscription");
const currentDateTimeWAT = DateTime.now().setZone("Africa/Lagos");
const PaymentModel = require("../models/PaymentModel"); // Replace with the correct path to

// Controller for creating a payment
const bookproduct = asyncHandler(async (req, res) => {
    try{
  const { shop_id, quantity, amount,paymentDate,paymentStatus } = req.body;
  const { id } = req.auth;
  if ( !paymentDate||!paymentStatus||!shop_id || !quantity || !amount) {
    throw new Error("Fields cannot be empty");
  }
  const user = await USER.findById(id);
  const shop = await SHOPS.findById(shop_id);
  if (!user) throw new Error("user not found");
  if (!shop) throw new Error("product not found");
  const newPayment = await PaymentModel.create({
    shop_name:shop.shop_name,
    user_id:user._id,
    shop_id:shop._id,
    quantity,
    amount,
  });
const token = generateToken(user._id)
  if (newPayment) {
    res.status(201)
        .header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: newPayment,
    });
  }
  logger.info(
    `user with id: ${id} paid a product with id ${shop._id} for plan ${type}, for the duration of a ${plan} from ${startDate}, to ${endDate} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
  )}catch(error){
    throw new Error(`${error}`)
  }
});

// // Controller for updating a payment
// const updatePayment = asyncHandler(async (req, res) => {
//   const { paymentId, paymentStatus } = req.body;

//   if (!paymentId || !paymentStatus) {
//     throw new Error("Payment ID and payment status are required");
//   }

//   const updatedPayment = await PaymentModel.findByIdAndUpdate(
//     paymentId,
//     { paymentStatus },
//     { new: true }
//   );

//   if (updatedPayment) {
//     res.status(200).json({
//       status: "success",
//       data: updatedPayment,
//     });
//   }
// });

// Controller for retrieving all payments
const getPayments = asyncHandler(async (req, res) => {
  const payments = await PaymentModel.find();

  if (payments) {
    res.status(200).json({
      status: "success",
      data: payments,
    });
  }
});

module.exports = { createPayment, updatePayment, getPayments };

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
// const searchItems = asynchandler(async (req, res) => {
//   const query = req.query.query;
//   try {
//     const shopResults = await SHOPS.find({ $text: { $search: query } });
//     const blogResults = await BLOGS.find({ $text: { $search: query } });

//     // Combine and sort the results
//     const combinedResults = [...shopResults, ...blogResults].sort(
//       (a, b) => b.createdAt - a.createdAt
//     );

//     // const token = generateToken(id);.header("Authorization", `Bearer ${token}`)
//     res.status(200).json({
//       data: combinedResults,
//     });

//     logger.info(
//       `Search results fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
//     );
//   } catch (error) {
//     console.error(error);
//     throw new Error(`${error}`);
//   }
// });

module.exports = {
  adminsubscibtionpanel,
  updateSubscriptionPlan,
  getalluserssubscibtion,
  createSubscription,
};
