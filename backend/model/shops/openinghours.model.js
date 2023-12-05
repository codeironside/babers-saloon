const mongoose = require('mongoose');

const workinghoursSchema = mongoose.Schema({
  shopId: { type: mongoose.Schema.ObjectId, ref: 'SHOPS', required: true },
  hours: {
    monday: {
      morning: { type: String, default: "09:30:00" },
      afternoon: { type: String, default: "14:00:00" },
      evening: { type: String, default: "18:00:00" },
    },
    tuesday: {
      morning: { type: String, default: "09:30:00" },
      afternoon: { type: String, default: "14:00:00" },
      evening: { type: String, default: "18:00:00" },
    },
    wednesday: {
      morning: { type: String, default: "09:30:00" },
      afternoon: { type: String, default: "14:00:00" },
      evening: { type: String, default: "18:00:00" },
    },
    thursday: {
      morning: { type: String, default: "09:30:00" },
      afternoon: { type: String, default: "14:00:00" },
      evening: { type: String, default: "18:00:00" },
    },
    friday: {
      morning: { type: String, default: "09:30:00" },
      afternoon: { type: String, default: "14:00:00" },
      evening: { type: String, default: "18:00:00" },
    },
    saturday: {
      morning: { type: String, default: "09:30:00" },
      afternoon: { type: String, default: "14:00:00" },
      evening: { type: String, default: "18:00:00" },
    },
    sunday: {
      morning: { type: String, default: "09:30:00" },
      afternoon: { type: String, default: "14:00:00" },
      evening: { type: String, default: "18:00:00" },
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("workinghours", workinghoursSchema);
