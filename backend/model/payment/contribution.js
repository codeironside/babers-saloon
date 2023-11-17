const mongoose = require('mongoose');

const crowdfundingSchema = new mongoose.Schema({
  campaignName: {
    type: String,
    required: [true, 'Please add a campaign name'],
    unique:true
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'USER', // Reference to the User schema
    required: true,
  },
  organizer_name:{
    type:String
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
        ref: 'USER', // Reference to the User schema
      },
      amount: {
        type: Number
      },
      contributor_name:{
        type:String,

      },
      contributionDate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
},{
  timestamps:true
});

const Crowdfunding = mongoose.model('Crowdfunding', crowdfundingSchema);

module.exports = Crowdfunding;
