const mongoose = require('mongoose');

const workinghoursSchema = new mongoose.Schema({
  hours: {
    monday: {
      opening: { type: Date, default: new Date('2023-10-09T10:00:00.000Z') },
      closing: { type: Date, default: new Date('2023-10-09T18:00:00.000Z') },
    },
    tuesday: {
      opening: { type: Date, default: new Date('2023-10-10T10:00:00.000Z') },
      closing: { type: Date, default: new Date('2023-10-10T18:00:00.000Z') },
    },
    wednesday: {
      opening: { type: Date, default: new Date('2023-10-11T10:00:00.000Z') },
      closing: { type: Date, default: new Date('2023-10-11T18:00:00.000Z') },
    },
    thursday: {
      opening: { type: Date, default: new Date('2023-10-12T10:00:00.000Z') },
      closing: { type: Date, default: new Date('2023-10-12T18:00:00.000Z') },
    },
    friday: {
      opening: { type: Date, default: new Date('2023-10-13T10:00:00.000Z') },
      closing: { type: Date, default: new Date('2023-10-13T18:00:00.000Z') },
    },
    saturday: {
      opening: { type: Date, default: new Date('2023-10-14T10:00:00.000Z') },
      closing: { type: Date, default: new Date('2023-10-14T18:00:00.000Z') },
    },
    sunday: {
      opening: { type: Date, default: new Date('2023-10-15T10:00:00.000Z') },
      closing: { type: Date, default: new Date('2023-10-15T18:00:00.000Z') },
    },
  },
}, {
  timestamps: true,
});
module.exports=mongoose.model("workinghours",workinghoursSchema)
