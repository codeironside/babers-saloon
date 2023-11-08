const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  shop_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SHOP', // Reference to the Vendor schema
    required: true,
  },
  type: {
    type: String,
    enum: ['gold', 'diamond'], // Define the specific subscription plans here
    required: [true,'please and a subscription type'],
  },
  plan: {
    type: String,
    enum: ['monthly', 'yearly'], // Define the specific subscription plans here
    required: [true,'please and a subscription type'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'canceled'],
    default: 'active',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  billingDetails: {
    paymentMethod: {
      type: String,
      required: true,
    },
    billingAddress: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    }
  },
    shop_name: {
      type: String,
      required: true,
    }
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
