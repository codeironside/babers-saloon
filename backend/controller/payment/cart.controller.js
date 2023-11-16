const asynchandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const USER = require("../../model/users/user");
const SHOPS = require("../../model/shops/shop");
const logger = require("../../utils/logger");
const { DateTime } = require("luxon");
const { convertToWAT } = require("../../utils/datetime");
const Subscription = require("../../model/payment/subscription");
const cart = require("../../model/payment/cart");
const currentDateTimeWAT = DateTime.now().setZone("Africa/Lagos");
const mongoose = require("mongoose")

const makecart = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    let { items } = req.body; 
    if (!id) throw Object.assign(new Error("Not allowed"), { statusCode: 403 });
    ;
    const user = await USER.findById(id);
    if (!user) throw Object.assign(new Error("Not a user"), { statusCode: 404 });
    ;
    let totalAmount = 0;
    if (typeof items === 'string') {
      items = JSON.parse(items);
    }
    for (item of items) {
      const shop = await SHOPS.findById(item.shop_id);
      console.log(item)
      if (!shop) throw Object.assign(new Error("No shops found"), { statusCode: 404 });
      ;
      if (shop.category === "barbers")
      throw new Error("cart is reserved for only none barbers");
      item.amount = item.quantity * shop.price; 
      totalAmount += item.amount;
      item.product = shop._id;
      item.product_name = shop.shop_name;
    }

    const book = await cart.create({
      user: user._id,
      user_name: user.userName,
      items,
      totalAmount,
    });

    if (book) {
      const token = generateToken(user._id);
      res.status(201).header("Authorization", `Bearer ${token}`).json({
        successful: true,
        data: book,
      });
      logger.info(
        `user with id: ${id} carted a product${product} from vendor with id ${shop.shop._id}, and name:${shop.shop_name} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`
      );
    }
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode });
  }
});


// Controller for updating a booking
// Controller to update the cart
const updateCart = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    let { items } = req.body;
    const user = await USER.findById(id)
    if (!user) {
      throw Object.assign(new Error("user not found"), { statusCode: 404 });
;
    }
    if (typeof items === 'string') {
      items = JSON.parse(items);
    }
    if (!items || !Array.isArray(items)) {
      throw Object.assign(new Error("Invalid items format"), { statusCode: 400 });
;
    }

    const userCart = await cart.findOne({ user: id });
    const existingItems = userCart ? userCart.items : [];

    // Iterate through the items in the request
    for (const item of items) {
      const { shop_id, quantity } = item;

      // Check if the shop exists
      const shop = await SHOPS.findById(shop_id);
      if (!shop) {
        throw Object.assign(new Error("shop not found"), { statusCode: 404 });
;
      }

      // Check if the product already exists in the user's cart
      const existingProductIndex = existingItems.findIndex(
        (existingItem) => existingItem.product.toString() === shop_id
      );

      if (existingProductIndex !== -1) {
        // If the product exists, update quantity and amount
        existingItems[existingProductIndex].quantity += quantity;
        existingItems[existingProductIndex].amount +=
          quantity * shop.price;
      } else {
        // If the product doesn't exist, add it to the user's cart
        existingItems.push({
          product: shop_id,
          product_name: shop.shop_name,
          quantity,
          amount: quantity * shop.price,
        });
      }
    }

    // Calculate the total amount for the user's cart
    const totalAmount = existingItems.reduce(
      (total, item) => total + item.amount,
      0
    );

    // Update the user's cart with the modified items and totalAmount
    if (userCart) {
      userCart.items = existingItems;
      userCart.totalAmount = totalAmount;
      await userCart.save();
    } else {
      // Create a new cart for the user if it doesn't exist
      const newCart = new cart({
        user: id,
        user_name: user.userName,
        items: existingItems,
        totalAmount,
      });
      await newCart.save();
    }
const token = generateToken(id)
    res.status(200).header("Authorization",`Bearer ${token}`).json({
      updatedCart: userCart || newCart, 
    });

    // Log your info here if needed
    logger.info(`user with id: ${id} updated his cart ${userCart._id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip} - from ${req.ip}`);
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode });
    ;
  }
});


// Controller to get all cart for admins
const getAllcartForAdmins = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (!(user.role === "superadmin" || process.env.role === "superadmin"))
    throw Object.assign(new Error("Not authorized"), { statusCode: 401 });
    const carts = await cart.find();
    const token = generateToken(id);
    res.status(200).header("Authoriation", `Bearer ${token}`).json({
      status: "success",
      data: carts,
    });

    logger.info(
      `All carts retrieved for admin - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode });

  }
});

// Controller to get all carts for a vendor
const getAllCartsForVendor = asynchandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { id } = req.auth;
    const user = await USER.findById(id);
    const shop = await SHOPS.findById(vendorId);

    if (
      !shop ||
      (id !== shop.owner && process.env.role.toString() !== "superadmin")
    ) {
      throw Object.assign(new Error("Not authorized"), { statusCode: 401 });
    }

    let carts = await cart.find().populate({
      path: "items.product",
      model: "SHOPS",
    }).populate({
      path: "user",
      model: "USER",
      select: "firstName  userName email number" 
    });;
    carts = carts.map(cart => {
      cart = cart.toObject();
      cart.items = cart.items.filter(item => item.product._id.toString() === vendorId);
      return cart;
    });
    
    const token = generateToken(id);

    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: carts,
    });
    logger.info(
      `All carts retrieved for vendor with ID: ${vendorId} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw Object.assign(new Error(`${error}`), { statusCode: error.statusCode });
  }
});

const getAllcartsForuser = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (id !== user._id.toString() || process.env.role.toString() !== "superadmin")
    throw Object.assign(new Error("Not authorized"), { statusCode: 401 })
    let carts = await cart.find({ user: id })
    .populate({
      path: "items.product",
      model: "SHOPS", 
      populate: {
        path: "owner",
        model: "USER", 
        select: "firstName email number address" 
      },
      select: "shop_name contact_email shop_address contact_number" 
    });

  const token = generateToken(id);

  res.status(200).header("Authorization", `Bearer ${token}`).json({
    status: "success",
    data: carts,
  });

  logger.info(
    `All carts retrieved for user with ID: ${id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
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
  makecart,
  updateCart,
  getAllcartForAdmins,
  getAllCartsForVendor,
  getAllcartsForuser,
};
