const mongoose = require('mongoose');

const crowdfundingSchema = new mongoose.Schema({
  campaignName: {
    type: String,
    required: [true, 'Please add a campaign name'],
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User schema
    required: true,
  },
  goalAmount: {
    type: Number,
    required: true,
  },
  currentAmount: {
    type: Number,
    default: 0,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  contributions: [
    {
      contributor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User schema
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      contributionDate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const Crowdfunding = mongoose.model('Crowdfunding', crowdfundingSchema);

module.exports = Crowdfunding;
