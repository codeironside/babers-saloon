// Import Mongoose
const mongoose = require("mongoose");
const BookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "USER",
      required: [true, "please add an id"],
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SHOPS",
      required: true,
    },
    service: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    no_persons: {
      type: Number,
      required: [true, "please add the number of persons"],
      default: 1,
    },

    amount: {
      type: Number,
      required: [true, "please add the number of persons"],
      default: 1,
    },
    paid: {
      type: Boolean,
      default: false,
      required: [true, "please specify payment"],
    },
  },
  {
    timestamps: true,
  }
);

// Create a model from the schema
const Booking = mongoose.model("Booking", BookingSchema);

// Export the model
module.exports = Booking;
