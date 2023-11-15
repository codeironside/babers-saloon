const mongoose = require("mongoose");

const SHOPS = new mongoose.Schema(
  {
    shop_name: {
      type: String,
      required: [true, "please add a shop name"],
      unique: true,
    },
    shop_address: {
      type: String,
      required: [true, "please add an address"],
    },
    keywords: {
      type: String,
      required: [true, "please add a keyword"],
    },
    google_maps_place_id: {
      type: String,
    },
    longitude: {
      type: String,
    },
    latitude: {
      type: String,
    },
    images: {
      type: String,
    },
    video: {
      type: String,
    },
    description: { type: String },
    website: { type: String },
    facebook: { type: String },
    twitter: { type: String },
    whatsapp: { type: String },
    instagram: { type: String },
    minimum_price: { type: String },
    maximum_price: { type: String },
    workinghours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkingHours",
      },
    ],
    instant_booking: { type: String },
    category: {
      type: String,
      required: [true, "please add a category"],
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      required: [true, "please include an owners Id"],
      ref: "USER",
    },
    contact_number: {
      type: String,
      required: [true, "please include a contact number"],
    },
    contact_email: {
      type: String,
      required: [true, "please include a contact email"],
    },
    approved : {
      type:Boolean,
      default:false
    },
    price:{
      type:Number,
      default:0
    },
    availabilty:{
      type:Boolean,
      default:false
    },
    
    servicesOffered: {
      type: [String], // Array of services offered
    },
    subscriptionType:{
      type:String
    }
  },
  {
    timestamps: true,
  }
);

SHOPS.index({ shop_name: 'text' });

const ShopsModel = mongoose.model("SHOPS", SHOPS);

ShopsModel.ensureIndexes();

module.exports = ShopsModel;
