const mongoose = require('mongoose');
const crypto = require('crypto');

const generateTicketToken = () => {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `LC-${randomPart}`;
};

const supportTicketSchema = new mongoose.Schema(
  {
    ticketToken: {
      type: String,
      unique: true,
      index: true,
      default: generateTicketToken,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
      default: null,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
      default: 'Pending',
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
      trim: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // creates createdAt and updatedAt
  }
);

// Fallback to ensure ticketToken is always assigned before validation
supportTicketSchema.pre('validate', function () {
  if (!this.ticketToken) {
    this.ticketToken = generateTicketToken();
  }
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
