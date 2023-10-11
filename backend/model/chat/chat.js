const mongoose = require("mongoose");
const messages = mongoose.Schema(
  {
    chat: {
      type: String,
     
    },

  },

  {
    timestamps: true,
  }
);
module.exports = mongoose.model("CHAT", messages);
