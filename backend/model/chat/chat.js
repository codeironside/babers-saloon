const mongoose = require("mongoose");
const thread = mongoose.Schema(
  {
    thread: {
      type: String,
      required:[true,'please add a message'],
     
    },
    topic: {
      type: String,
      required:[true,'please add a topic'],
     
    },
    category: {
      type: String,
      required:[true,'please add a category'],
     
    },
    // images: {
    //   type: String,
     
    // },
    thread_owner:{
      type :mongoose.Schema.Types.ObjectId,
      required:[true,'please add an owner id'],
      ref:'USER'
    },
    userName:{
      type :String,
      required:[true,'please add a owner name'],
    },
    image:{
      type :String,
    },


  },

  {
    timestamps: true,
  }
);
module.exports = mongoose.model("thread",thread );
