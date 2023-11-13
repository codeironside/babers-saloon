// Import Mongoose
const mongoose = require('mongoose');
const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'USER',
    required: true
  },
  shop:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SHOP',
    required: true
  },
  shop_name:{
    type: String,
    required: [,'please add a shop name']
  },
  service: {
    type: String,
    required: true
  },
  user_userName: {
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
  paid: {
    type: Boolean,
    default: false,
    required:[true,'please specify payment']
  }
},{
  timestamps:true
});

// Create a model from the schema
const Booking = mongoose.model('Booking', BookingSchema);

// Export the model
module.exports = Booking;
