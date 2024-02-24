const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Each message will have its own timestamp.
  }
);

const conversationSchema = new mongoose.Schema(
  {
    user_one: { type: mongoose.Schema.Types.ObjectId, ref: "SHOPS" }, // Reference to the seller
    user_two: { type: mongoose.Schema.Types.ObjectId, ref: "USER" }, // Reference to the buyer
    messages: [messageSchema], // An array of message objects.
  },
  {
    timestamps: true, // The conversation itself will also have a timestamp.
  }
);

const Conversation = mongoose.model("CONVERSATION", conversationSchema);

module.exports = Conversation;
