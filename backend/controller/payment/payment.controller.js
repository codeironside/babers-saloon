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
const PaymentModel = require("../../model/payment/payment");
const Booking = require("../../model/payment/booking");
const Cart = require("../../model/payment/cart");

// Controller for creating a payment
const paidproduct = asynchandler(async (req, res) => {
  try {
    const {
      booking_id,
      cart_id,
      category,
      paymentStatus,
    } = req.body;
    const { id } = req.auth;
    if (!paymentStatus || !category) {
      throw Object.assign(new Error("fields can not be empty"), { statusCode: 404 });
    }
    const user = await USER.findById(id);
    if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
    
    let newPayments = [];
    
    if (category === "barbers") {
      const booking = await Booking.findById(booking_id);
      if (!booking) throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
      if (id!==booking.user.toString()) throw Object.assign(new Error("not allowed"), { statusCode: 403 });
      const shop = await SHOPS.findById(booking.shop);
      if (!shop) throw Object.assign(new Error("Shop not found"), { statusCode: 404 });

      const newPayment = await PaymentModel.create({
        shop_name: shop.shop_name,
        user_id: user._id,
        user_name: user.userName,
        shop_id: shop._id,
        amount:booking.amount,
        paymentStatus,
        transaction_id: booking._id,
        onModel: 'Booking'
      });

      if (newPayment) {
        await Booking.findByIdAndUpdate(
          booking._id,
          { $set: { paid: true } },
          { new: true }
        );
      }
      const token = generateToken(user._id);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        status: "success",
        data: newPayment,
      });
  
      logger.info(
        `User with id: ${id} paid for a product - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    } else {
      
      const cart = await Cart.findById(cart_id);
      if (!cart) throw Object.assign(new Error("Cart not found"), { statusCode: 404 });
      // console.log(id, cart)
      if (id!==cart.user.toString()) throw Object.assign(new Error("not allowed"), { statusCode: 403 });
      for (let item of cart.items) {
        console.log(item.product)
        const shop = await SHOPS.findById(item.product);
        
        if (!shop) throw Object.assign(new Error(`Shop not found for product ${item.product}`), { statusCode: 404 });

        const newPayment = await PaymentModel.create({
          shop_name: shop.shop_name,
          user_id: user._id,
          user_name: user.userName,
          shop_id: shop._id,
          amount: item.amount,
          paymentStatus,
          transaction_id: cart._id,
          onModel: 'Cart'
        });
        newPayments.push(newPayment)
      }
      if (newPayments.length > 0) {
        await Cart.findByIdAndUpdate(
          cart._id,
          { $set: { paid: true } },
          { new: true }
        );
      }
      const token = generateToken(user._id);
      res.status(200).header("Authorization", `Bearer ${token}`).json({
        status: "success",
        data: newPayments,
      });
  
      logger.info(
        `User with id: ${id} paid for a product - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    }


  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode || 500 });
  }
});


// // Controller for updating a payment

//controller to get
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

//cpntroller for admin
const getPaymentsforadmin = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (!(user.role === 'superadmin' || process.env.role.toString() === 'superadmin')) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 401 });
    }

    const payments = await PaymentModel.find()
    .populate({
      path: 'user_id',
      model: 'USER',
      select: 'name email number address'
    })
    .populate({
      path: 'shop_id',
      model: 'SHOPS',
      select: 'shop_name contact_email shop_address contact_number' 
    })
    .populate({
      path: 'transaction_id',
      modelPath: 'onModel'
    });
  

    const token = generateToken(user._id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: payments,
    });

    logger.info(
      `Admin with id ${user.id} fetched all payments - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode || 500 });
  }
});

//controller for payment for all users
const getPaymentsforuser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
    if (id !== user._id.toString()) throw Object.assign(new Error("not authorized"), { statusCode: 403 });

    const payments = await PaymentModel.find({ user_id: user._id })
      .populate({
        path: 'shop_id',
        model: 'SHOPS',
        select: 'shop_name contact_email shop_address contact_number' 
      })
      .populate({
        path: 'transaction_id',
        modelPath: 'onModel'
      });

    const token = generateToken(user._id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: payments,
    });

    logger.info(
      `User with id ${user.id} fetched all payments - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode });
  }
});


//controller fpr vendor
const getPaymentsforvendor = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { shop_id } = req.body;
    const user = await USER.findById(id);
    if (!user) throw Object.assign(new Error("User not found"), { statusCode: 404 });
    const shop = await SHOPS.findById(shop_id);

    if (!shop) throw Object.assign(new Error("Shop not found"), { statusCode: 404 });
   if (id!==shop.owner.toString() && process.env.role.toString()!=='superadmin') throw Object.assign(new Error("not authorized"), { statusCode: 403 });
    const payments = await PaymentModel.find({ shop_id: shop._id })
      .populate({
        path: 'user_id',
        model: 'USER',
        select: 'firstName email number address' 
      })
      .populate({
        path: 'transaction_id',
        modelPath: 'onModel'
      });

    const token = generateToken(user._id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: payments,
    });

    logger.info(
      `Vendor with id ${user.id} fetched all payments - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode || 500 });
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
paidproduct,
getPaymentsforadmin,
getPaymentsforuser,
getPaymentsforvendor
 
};
