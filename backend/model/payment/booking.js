// Import Mongoose
const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  isConfirmed: {
    type: Boolean,
    default: false
  }
});

// Create a model from the schema
const Booking = mongoose.model('Booking', BookingSchema);

// Export the model
module.exports = Booking;
