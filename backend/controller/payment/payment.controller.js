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
      amount,
      paymentDate,
      paymentStatus,
    } = req.body;
    const { id } = req.auth;
    if (!paymentDate || !paymentStatus || !shop_id || !quantity || !amount) {
      throw new Error("Fields cannot be empty");
    }
    const user = await USER.findById(id);
    if (!user) throw new Error("user not found");

    if (category === "barbers") {
      const shop = await Booking.findById(booking_id);
      const name = await SHOPS.findById(shop.shop);

      if (!shop) throw new Error("Booking not found");
      const newPayment = await PaymentModel.create({
        shop_name: name.shop_name,
        user_id: user._id,
        shop_id: shop._id,
        user_name:user.userName,
        amount,
        paymentDate,
        paymentStatus,
      });
      const token = generateToken(user._id);
      if (newPayment) {
        const pay = await Booking.findByIdAndUpdate(
          shop._id,
          { $set: { paid: true } },
          { new: true }
        );
        if(pay){
          res.status(201).header("Authorization", `Bearer ${token}`).json({
            status: "success",
            data: newPayment,
          });
        }else{
          throw new Error('update payement error')
        }

      }
      logger.info(
        `user with id: ${id} paid a product with id ${shop._id} for plan ${type}, for the duration of a ${plan} from ${startDate}, to ${endDate} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    } else {
      const cart = await Cart.findById(cart_id);
      if (!cart) throw new Error("Cart not found");

      const paymentReceipts = [];

      for (const item of cart.items) {
        const shop = await SHOPS.findById(item.product);
        if (!shop)
          throw new Error(`Shop not found for product ${item.product}`);

        const newPayment = await PaymentModel.create({
          shop_name: shop.shop_name,
          user_id: user._id,
          
        user_name:user.userName,
          shop_id: shop._id,
          amount: item.amount,
          paymentDate,
          paymentStatus,
        });

        paymentReceipts.push(newPayment);
      }

      // Update the cart to mark it as paid
      cart.paid = true;
      await cart.save();

      const token = generateToken(user._id);
      if (paymentReceipts.length > 0) {
        const pay = await Cart.findByIdAndUpdate(
          shop._id,
          { $set: { paid: true } },
          { new: true }
        );
        if(pay){
                  res.status(201).header("Authorization", `Bearer ${token}`).json({
          status: "success",
          data: paymentReceipts,
        });
        }

      }

      logger.info(
        `User with id: ${id} paid for products in cart with id ${cart._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
      );
    }
  } catch (error) {
    throw new Error(`${error}`);
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
const getPaymentsforadmin = asynchandler(async (req, res) => {
  try{  const{ id}= req.auth
  const user = await USER.findById(id)
  if(!(user.role==='superadmin'|| proces.env.role.toString()==='superadmin')){
    throw new Error('not authorized')
  }
  const payments = await PaymentModel.find();
const token = await generateToken(user._id)
  if (payments) {
    res.status(200).heaer("Authorization",`Bearer ${token}`).json({
      status: "success",
      data: payments,
    });
    logger.info(
      `admin with id ${user.id} fetch all payments- ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    )
  }}catch(error){
    throw new Error(`${error}`)
  }

});
//controller for payment for all users
const getPaymentsforuser = asynchandler(async (req, res) => {
  try{
      const{ id}= req.auth
  const user = await USER.findById(id)
  if(!user){
    throw new Error('not authorized')
  }
  const payments = await PaymentModel.find({user_id:user._id});
const token = await generateToken(user._id)
  if (payments) {
    res.status(200).heaer("Authorization",`Bearer ${token}`).json({
      status: "success",
      data: payments,
    });
    logger.info(
      `admin with id ${user.id} fetch all payments- ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    )
  }
  }catch(error){throw new Error(`${error}`)}

});
const getPaymentsforvendor = asynchandler(async (req, res) => {
  try{  const{ id}= req.auth
  const {shop_id}=req.body
  const user = await USER.findById(id)
  const book = await Booking.findById(shop_id)
  const cart= await Cart.findById(shop_id)
  if(!user){
    throw new Error('not authorized')
  }
  if(!(id===book.user||id===cart.user)){
    throw new Error('not authorized')
  }
  const payments = await PaymentModel.find({shop_id:shop
  -id});
const token = await generateToken(user._id)
  if (payments) {
    res.status(200).heaer("Authorization",`Bearer ${token}`).json({
      status: "success",
      data: payments,
    });
    logger.info(
      `vendor with id ${user.items.product} fetch all payments- ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    )
  }}catch(error){throw new Error(`${error}`)}

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
