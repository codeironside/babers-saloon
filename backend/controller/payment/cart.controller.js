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

const makecart = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { paid, totalAmount, amount, quantity, shop_id } = req.body;
    if (!id) throw new Error("not allowed");
    const user = await USER.findById(id);
    if (!user) throw new Error("user not found");
    const shop = await SHOPS.findById(shop_id);
    if (!shop_id) throw new Error("shop not found");
    if (shop.category === "barbers")
      throw new Error("cart is reserved for only none barbers");
    const book = await cart.create({
      user: user._id,
      user_name:user.userName,
      items: { shop: shop._id, product_name: shop.shop_name, quantity, amount },
      totalAmount,
      paid,
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
    throw new Error(`${error}`);
  }
});

// Controller for updating a booking
// Controller to update the cart
const updateCart = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const { cartId } = req.params;
    const { product, quantity } = req.body;

    if (!cartId) {
      throw new Error("Cart ID is required");
    }

    const cart = await Cart.findById(cartId);

    if (!cart) {
      throw new Error("Cart not found");
    }

    if (id.toString() !== cart.user.toString()) {
      throw new Error("User cannot edit this cart");
    }

    // Check if the product is already in the cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === product
    );

    if (existingItem) {
      // If the product is found, update the quantity
      existingItem.quantity += quantity || 1;
    } else {
      // If the product is not found, add a new item to the cart
      cart.items.push({
        product,
        quantity: quantity || 1,
      });
    }

    // Recalculate totalAmount based on updated items
    cart.totalAmount = calculateTotalAmount(cart.items);

    // Save the updated cart
    const updatedCart = await cart.save();

    const token = generateToken(id);

    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
      data: updatedCart,
    });

    logger.info(
      `Cart with ID: ${cartId} updated by user with ID ${req.auth.id} - ${res.statusCode} - ${res.statusMessage} - ${req.originalUrl} - ${req.method} - ${req.ip}`
    );
  } catch (error) {
    throw new Error(`${error}`);
  }
});

// Controller to get all cart for admins
const getAllcartForAdmins = asynchandler(async (req, res) => {
  try {
    const { id } = req.auth;
    const user = await USER.findById(id);
    if (!(user.role === "superadmin" || process.env.role === "superadmin"))
      throw new Error("not authorized");
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
    throw new Error(`${error}`);
  }
});

// Controller to get all carts for a vendor
const getAllCartsForVendor = asynchandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { id } = req.auth;

    const shop = await SHOPS.findById(vendorId);

    if (
      !shop ||
      (id !== shop.owner && process.env.role.toString() !== "superadmin")
    ) {
      throw new Error("Not authorized");
    }

    const carts = await Cart.find({ "items.product": vendorId })
      .populate("user")
      .populate({
        path: "items.product",
        model: "SHOP", // Adjust the model name based on your ShopsModel
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
    throw new Error(`${error}`);
  }
});

const getAllcartsForuser = asynchandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { id } = req.auth;
    const Shop = await SHOPS.findById(vendorId);
    if (id !== Shop.owner || process.env.role.toString() !== "superadmin")
      throw new Error("nor authorized");
    const bookings = await cart.find({ user: id });
    const token = generateToken(id);
    res.status(200).header("Authorization", `Bearer ${token}`).json({
      status: "success",
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
module.exports = {
  makecart,
  updateCart,
  getAllcartForAdmins,
  getAllCartsForVendor,
  getAllcartsForuser,
};
