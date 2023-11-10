const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const USER = require("../../model/users/user");
const SHOPS = require("../../model/shops/shop");
const COMMENT = require("../../model/blogs/comments");
const logger = require("../../utils/logger");
const { DateTime } = require("luxon");
const { convertToWAT } = require("../../utils/datetime");
const Subscription = require('../../model/payment/subscription')
const currentDateTimeWAT = DateTime.now().setZone("Africa/Lagos");

//desc register users
//access public
//router /users/register
// Controller for creating a subscription
const createSubscription = asynchandler(async (req, res) => {
  try{
  const { vendor,plan, type,paymentMethod, billingAddress, name,status } = req.body;
  const startDate = new Date(); // Set the start date as the current date
  const {id}=req.auth
  let endDate = new Date(startDate); // Set the end date based on the selected plan
  const user = await USER.findById(id)
  if(!user) throw new Error('user not found');
  const shop = await SHOPS.findById(vendor)
  if(user._id !== shop.owner.toString() || process.env.role.toString()!=='superadmin'){
    throw new Error('not authorized')
  }
  if (plan === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (plan === 'yearly') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  if (!vendor || !type || !paymentMethod || !billingAddress || !name || !status) {
    throw new Error("Vendor, type, payment method, billing address,name , and status are required");
  }


  const newSubscription = await Subscription.create({
    vendor,
    plan,
    type,
    startDate,
    endDate,
    billingDetails: {
      paymentMethod,
      billingAddress,
      name,
    },
    shop_name: shop.shop_name
  });


const update = await USER.findByIdAndUpdate(id,{$set:{subscribed:true, type:type}})
const token = generateToken(id)
  if (update) {
    res.status(200)
        .header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: newSubscription,
    });
  }
  logger.info(
    `user with id: ${id} paid subscription for his enteprise ${vendor} for plan ${type}, for the duration of a ${plan} from ${startDate}, to ${endDate} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
  )}catch(error){
    throw new Error(`${error}`)
  }
});


//access  private
// get all subscription plan
const adminsubscibtionpanel = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  console.log(page, "   ", pageSize);
  const { id } = req.auth;
  const user = await USER.findById(id);
  try {
    if (user._id.toString() === id || process.env.role.toString() === "superadmin") {
      const allUsers = await Subscription.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize);;

      const token = generateToken(id);
      res
        .status(200)
        .header("Authorization", `Bearer ${token}`)
        .json({
          data: allUsers,
          page: page,
          totalPages: Math.ceil(totalCount / pageSize),
        });

      logger.info(
        `subscriptions for users were fetched for admin with id::${id}- ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    } else {
      throw new Error("not authorized");
    }
  } catch (error) {
    console.log(error);
    throw new Error(`${error}`);
  }
});

//update one user
//access private for user
const updateSubscriptionPlan = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth; // Get the user ID from the request
    const { plan,type,status } = req.body; // Get the vendor ID and new plan from the request body
    const {vendor}=req.params

    const user = await USER.findById(id);
    if (!user) throw new Error('User not found');

    const shop = await SHOPS.findById(vendor);
    if (user._id !== shop.owner.toString() || process.env.role.toString() !== 'superadmin') {
      throw new Error('Not authorized');
    }

    // Find the current subscription
    const currentSubscription = await Subscription.findByid(vendor);
    if (!currentSubscription) throw new Error('Subscription not found');
    const startDate = new Date();
    let endDate = new Date(startDate);
    if (newPlan === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (newPlan === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }
    const updatedSubscription = await Subscription.findByIdAndUpdate(currentSubscription._id, {$set:{
      type: type,
      startDate: startDate,
      endDate: endDate,
      plan:plan,
      status:status
    }}, { new: true });
    const token = generateToken(id)
    res.status(200)
    .header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: updatedSubscription,
    })
    logger.info(
      `user with id: ${id} updated his subscription for his enteprise ${vendor} for plan ${type}, for the duration of a ${plan} from ${startDate}, to ${endDate} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    );
  } catch (error) {
    throw new Error(`${error}`);
  }
});

//desc get all subscribtion for developers
const getalluserssubscibtion = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  console.log(page, "   ", pageSize);
  const { id } = req.auth;
  const user = await USER.findById(id);
  try {
    if (user._id.toString() === id || process.env.role.toString() === "superadmin") {
      const allUsers = await Subscription.find({shop_id:id})
        .skip((page - 1) * pageSize)
        .limit(pageSize);;

      const token = generateToken(id);
      res
        .status(200)
        .header("Authorization", `Bearer ${token}`)
        .json({
          data: allUsers,
          page: page,
          totalPages: Math.ceil(totalCount / pageSize),
        });

      logger.info(
        `subscriptions for users were fetched- ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    } else {
      throw new Error("not authorized");
    }
  } catch (error) {
    console.log(error);
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
  createSubscription
};
