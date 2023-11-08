const mongoose = require("mongoose");

const SHOPS = new mongoose.Schema(
  {
    shop_name: {
      type: String,
      required: [true, "please add a shop name"],
    },
    
    user_id: {
      type:mongoose.Schema.Types.ObjectId ,
      required: [true, "please add a user id"],
      ref:'USER'
    },
    shop_id: {
      type:mongoose.Schema.Types.ObjectId ,
      required: [true, "please add a shop id"],
      ref:'SHOP'
    },
    quantity: {
      type: String,
      required: [true, "please add a quantity"],
    },
  paid:{
      type:Boolean,
      default:false
    },
  amount:{
      type:String,
      default:false
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
