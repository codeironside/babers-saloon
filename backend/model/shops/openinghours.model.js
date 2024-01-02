const mongoose = require('mongoose');

const workingHoursSchema = mongoose.Schema({
  shopId: { type: mongoose.Schema.ObjectId, ref: 'SHOPS', required: true },
  hours: {
    Monday: [{ type: String }],
    Tuesday: [{ type: String }],
    Wednesday: [{ type: String }],
    Thursday: [{ type: String }],
    Friday: [{ type: String }],
    Saturday: [{ type: String }],
    Sunday: [{ type: String }],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("WorkingHours", workingHoursSchema);
