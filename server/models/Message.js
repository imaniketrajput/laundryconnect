const mongoose = require('mongoose');
const chatConnection = require('../config/chatDb');

const messageSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderRole: {
    type: String,
    enum: ["customer", "partner"],
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// PART 2 — 7-Day TTL Auto-Cleanup: MongoDB background sweep removes messages older than 7 days (604,800 seconds)
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

// Bind the model strictly to the separate chat connection
const Message = chatConnection ? chatConnection.model('Message', messageSchema) : null;

module.exports = Message;
