const mongoose = require("mongoose");
const MENU = mongoose.Schema(
  {
    shops_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SHOPS",
      required: true,
    },

    menu_name: {
      type: String,
      required: [true, "please add a name "],
      unique: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    QuantityAvailable: {
      type: Number,
      required: [true, "please add a quantity"],
    },
    total: {
      type: Number,
      default: 0,
      required: [true, "please add total quantity"],
    },
    menu_code: {
      type: String,
      required: [true, "please add a menu code "],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "please add a description"],
    },
    discount_Price: { type: String },
  },

  {
    timestamps: true,
  }
);
module.exports = mongoose.model("MENU", MENU);
