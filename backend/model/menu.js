const mongoose = require("mongoose");
const MENU = mongoose.Schema(
  {
    employeeid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EMPLOYEE",
      required: true,
    },
    enterprise_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BRANCH",
      required: true,
    },
    menuName: {
      type: String,
      required: [true, "please add a name "],
      unique: true,
    },
    price: {
      type: String,
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

    MI_group: { type: String, required: [true, "please add a group Number"] },
    description: {
      type: String,
      required: [true, "please add a description"],
    },
    MI_category: { type: String, required: [true, "please add a category"] },
    Happy_hour_Price: { type: String },
    Prep_Cost: { type: String },
  },

  {
    timestamps: true,
  }
);
module.exports = mongoose.model("MENU", MENU);
