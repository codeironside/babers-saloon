const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "SHOPS" }, // Reference to the seller
    buyer: { type: Schema.Types.ObjectId, ref: "USER" }, // Reference to the buyer
    messages: { type: String },
  },
  {
    timestamps: true,
  }
);


const conversation = mongoose.model("CONVERSATION", conversationSchema);

module.exports = conversation;
