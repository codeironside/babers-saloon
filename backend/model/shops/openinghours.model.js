const mongoose = require('mongoose');

const workinghoursSchema = new mongoose.Schema({

  hours: {
    monday: {
      opening: Date,
      closing: Date
    },
    tuesday: {
      opening: Date,
      closing: Date
    },
    wednesday: {
      opening: Date,
      closing: Date
    },
    thursday: {
      opening: Date,
      closing: Date
    },
    friday: {
      opening: Date,
      closing: Date
    },
    saturday: {
      opening: Date,
      closing: Date
    },
    sunday: {
      opening: Date,
      closing: Date
    }
  }
},{
    timestamps:true
});
module.exports=mongoose.model("workinghours",workinghoursSchema)
