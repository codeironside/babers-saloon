const mongoose = require('mongoose');

const workinghoursSchema = mongoose.Schema({
  shopId: { type: mongoose.Schema.ObjectId, ref: 'SHOPS', required: true },
  hours: {
    monday: {
      opening: { type: String, default: "09:30:00" },
      closing: { type: String, default: "21:30:00" },
    },
    tuesday: {
      opening: { type: String, default: "09:30:00" },
      closing: { type: String, default: "21:30:00" },
    },
    wednesday: {
      opening: { type: String, default: "09:30:00" },
      closing: { type: String, default: "21:30:00" },
    },
    thursday: {
      opening: { type: String, default: "09:30:00" },
      closing: { type: String, default: "21:30:00" },
    },
    friday: {
      opening: { type: String, default: "09:30:00" },
      closing: { type: String, default: "21:30:00" },
    },
    saturday: {
      opening: { type: String, default: "09:30:00" },
      closing: { type: String, default: "21:30:00" },
    },
    sunday: {
      opening: { type: String, default: "09:30:00" },
      closing: { type: String, default: "21:30:00" },
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("workinghours", workinghoursSchema);
