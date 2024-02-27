const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "USER" },
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
    user_one: { type: mongoose.Schema.Types.ObjectId, ref: "USER" },
    user_two: { type: mongoose.Schema.Types.ObjectId, ref: "USER" }, 
    messages: [messageSchema], // An array of message objects.
  },
  {
    timestamps: true, // The conversation itself will also have a timestamp.
  }
);

const Conversation = mongoose.model("CONVERSATION", conversationSchema);

module.exports = Conversation;
