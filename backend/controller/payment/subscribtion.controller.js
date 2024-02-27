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


//desc register users
//access public
//router /users/register
// Controller for creating a subscription
const createSubscription = asynchandler(async (req, res) => {
  try {
    const { plan, amount, type, paymentMethod, billingAddress, status } =
      req.body;
    const startDate = new Date(); // Set the start date as the current date
    const { id } = req.auth;
    const endDate = new Date(startDate); // Set the end date based on the selected plan
    const user = await USER.findById(id);

    if (!user)
      throw Object.assign(new Error("Not found"), { statusCode: 4034 });
    const find = await Subscription.findOne({ user_id: user._id });
    if (find)
      throw Object.assign(
        new Error(
          "cannot create two subscribtion, please update if that is what you wish to do"
        ),
        { statusCode: 403 }
      );

    const newSubscription = await Subscription.create({
      user_id: user._id,

      billingDetails: [
        {
          name: user.userName,
          billingAddress: billingAddress,
          paymentMethod,
          plan,
          type,
          amount,
          startDate,
          endDate,
          status,
        },
      ],
    });
    const update = await USER.findByIdAndUpdate(id, {
      $set: { subscribed: true, type: type },
    });
    if (!update) {
      throw Object.assign(new Error("Error updating user"), {
        statusCode: 500,
      });
    }
    // Update the subscription type for all shops
    const updateShops = await SHOPS.updateMany(
      { owner: user._id },
      { subscriptionType: type }
    );
    const Token = generateToken(user._id);
    if (Token) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.gmail,
          pass: process.env.password,
        },
      });
      // console.log(transporter);
      const html = `
      <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Successful Payment</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
  }
  
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  h1 {
    color: #333;
    text-align: center;
  }
  
  p {
    color: #666;
    line-height: 1.6;
  }
  
  .button {
    display: inline-block;
    padding: 10px 20px;
    background-color: #a88b4e;
    color: #fff;
    text-decoration: none;
    border-radius: 5px;
  }
  
  .button:hover {
    background-color: #0056b3;
  }
</style>
</head>
<body>
<div class="container">
  <h1>Successful Payment</h1>
  <p>Dear [Customer Name],</p>
  <p>We are pleased to inform you that your payment of $[Amount] has been successfully processed.</p>
  <p>Your order details:</p>
  <ul>
    <li>Order ID: [Order ID]</li>
    <li>Product: [Product Name]</li>
    <li>Amount: $[Amount]</li>
    <!-- Add more order details here if needed -->
  </ul>
  <p>Thank you for your purchase!</p>
  <p>If you have any questions or concerns, please don't hesitate to contact us.</p>
  <p>Best regards,<br> [Your Company Name]</p>
  <p><a href="" class="button">Visit our Website</a></p>
</div>
</body>
</html>  `;

      const mailOptions = {
        from: process.env.gmail,
        to: email,
        subject: `confirm yout mail, ${lastName} `,
        html: html,
      };
      referredUsers = await USER.find(
        { referredBy: referrerCode },
        "firstName lastName userName pictureUrl"
      );

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          throw new Error("email not sent");
        } else {
          console.log("Email sent: " + info.response);

          res.status(202).header("Authorization", `Bearer ${token}`).json({
            status: "202",
            message: updateReferral,
            referralCount: referredUsers.length,
            referredUsers: referredUsers,
          });
    
          logger.info(
            `User with ID ${createUsers._id} was created at ${createUsers.createdAt} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
          );
        }
      });
    }
    if (updateShops.nModified === 0) {
      return res.status(200).header("Authorization", `Bearer ${token}`).json({
        status: "success",
        message: newSubscription,
      });
    }

    res.status(200).header("Authorization", `Bearer ${Token}`).json({
      status: "success",
      message: newSubscription,
    });

    logger.info(
      `Subscription created for user with ID: ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    );
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

// Access private
// get all subscription plans
const adminSubscriptionPanel = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const { id } = req.auth;
  const user = await USER.findById(id);

  try {
    if (
      user.role === "superadmin" ||
      process.env.role.toString() === "superadmin"
    ) {
      // Calculate total count of subscriptions
      const totalCount = await Subscription.countDocuments();

      // Fetch subscriptions for the specified page and pageSize
      const allUsers = await Subscription.find()
        .skip((page - 1) * pageSize)
        .limit(pageSize);

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
        `Subscriptions  were fetched for admin with id: ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    } else {
      throw Object.assign(new Error("not authorized"), { statusCode: 403 });
    }
  } catch (error) {
    console.error(error);
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

// Update one user subscription plan
// Access private for user
// Update one user subscription plan
// Access private for user
const updateSubscriptionPlan = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth; // Get the user ID from the request
    const { plan, type, status, amount, paymentMethod, billingAddress } =
      req.body;
    //const { planId } = req.params; // Get the subscription plan ID from the request parameters

    const user = await USER.findById(id);
    if (!user)
      throw Object.assign(new Error("user not found"), { statusCode: 404 });
    const subscription = await Subscription.findOne({user_id:id});
    if (
      !subscription ||
      subscription.user_id.toString() !== id.toString()
    ) {
      throw Object.assign(new Error("who goes you"), { statusCode: 403 });
    }

    const currentDate = new Date();
    if (subscription.endDate > currentDate) {
      throw Object.assign(
        new Error(
          "Cannot cancel an existing subscription. It has not expired yet."
        ),
        { statusCode: 403 }
      );
    }

    const startDate = new Date();
    let endDate = new Date(startDate);
    if (plan === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    subscription.billingDetails.push({
      name: user.userName,
      billingAddress,
      paymentMethod,
      type,
      startDate,
      endDate,
      plan,
      status,
      amount,
    });

    // Update the subscription type for all shops owned by the user
    const updateShops = await SHOPS.updateMany(
      { owner: id },
      { subscriptionType: type }
    );

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      planId,
      {
        $set: {
          billingDetails: subscription.billingDetails,
        },
      },
      { new: true }
    );
    const update = await USER.findByIdAndUpdate(id, {
      $set: { subscribed: true, type: type },
    });
    const token = generateToken(id);
    if (updateShops.nModified === 0) {
      return res.status(200).header("Authorization", `Bearer ${token}`).json({
        message: newSubscription,
      });
    }

    res.status(200).header("Authorization", `Bearer ${token}`).json({
      data: updatedSubscription,
    });

    logger.info(
      `User with id: ${id} updated their subscription plan for subscription ${planId} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), {
      statusCode: error.statusCode,
    });
  }
});

// Description: Get all subscriptions for developers
const getAllUsersSubscription = asynchandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const { id } = req.auth;
  const user = await USER.findById(id);

  try {
    if (
      user._id.toString() === id ||
      process.env.role.toString() === "superadmin"
    ) {
      // Calculate total count of subscriptions for the specified user
      const totalCount = await Subscription.countDocuments({ user_id: id });

      // Fetch subscriptions for the specified user, page, and pageSize
      const allUsers = await Subscription.find({ user_id: user._id })
        .skip((page - 1) * pageSize)
        .limit(pageSize);

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
        `Subscriptions for user with ID: ${id} were fetched - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    } else {
      throw Object.assign(new Error("No subscription for user"), {
        statusCode: 404,
      });
    }
  } catch (error) {
    console.error(error);
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
  adminSubscriptionPanel,
  updateSubscriptionPlan,
  getAllUsersSubscription,
  createSubscription,
};
