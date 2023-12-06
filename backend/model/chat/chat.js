const mongoose = require("mongoose");
const CHAT = mongoose.Schema(
  {
    chat: {
      type: String,
      required:[true,'please add a message'],
     
    },
    // topic: {
    //   type: String,
    //   required:[true,'please add a message'],
     
    // },
    // category: {
    //   type: String,
    //   required:[true,'please add a message'],
     
    // },
    images: {
      type: String,
     
    },
    
    chat_owner:{
      type :mongoose.Schema.Types.ObjectId,
      required:[true,'please add an owner id'],
      ref:'USER'
    },
    userName:{
      type :String,
      required:[true,'please add a owner name'],
    },


  },

  {
    timestamps: true,
  }
);
module.exports = mongoose.model("CHAT",CHAT );
