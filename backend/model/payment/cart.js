const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER", // Reference to the User schema
      required: true,
    },
    user_name: {
      type: String,
      required: [true,'please add a user name'],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SHOP",
          required: true,
        },
        product_name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        amount: { type: Number, default: 1 },
      },
    ],
    totalAmount: {
      type: Number,
      default: 0,
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
