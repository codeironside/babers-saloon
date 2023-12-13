const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'USER', // Reference to the Vendor schema
    required: true,
  },

  billingDetails: [{
    type: {
      type: String,
      enum: ['premium', 'diamond'],
      required: [true,'please and a subscription type'],
    },
    plan: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: [true,'please and a subscription plan'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'canceled'],
      default: 'active',
    },
    startDate: {
      type: Date,
      required: [true,"please add a start date"],
    },
    amount: {
      type: Number,
      required: [true,'please add a payment amount'],
    },
    endDate: {
      type: Date,
      required: [true,"please add an end date"],
    },
    paymentMethod: {
      type: String,
      required: [true,'please add a payment a method'],
    },
    billingAddress: {
      type: String,
      required: [true, 'please add a billing address'],
    },
    name: {
      type: String,
      required: [true,'please add the user name'],
    }
}],
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
