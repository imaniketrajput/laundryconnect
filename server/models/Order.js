const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
    {
        status: {type: String, enum: ["Draft", "Placed", "PickedUp", "Washing", "Ready", "OutForDelivery", "Delivered", "Cancelled"],},

        timestamp: {type: Date, default: Date.now},
    },
    {_id: false}

);


const orderSchema = new mongoose.Schema(
    {
        customer: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},

        services: [
            {
                service: {type: mongoose.Schema.Types.ObjectId, ref: "Service"},
                quantity: Number,
            },
        ],
        pickupAddress: {type: String, required: true},
        pickupLocation: {
            lat: { type: Number },
            lng: { type: Number },
        },
        pickupDate: {type: String, required: true},
        pickupSlot: {type: mongoose.Schema.Types.ObjectId, ref: "Slot"},
        isExpress: {type: Boolean, default: false},
        priorityScore: { type: Number, default: 0 },
        assignedPartner: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner" },
        currentStatus: {
            type: String,
            enum: ["Draft", "Placed", "PickedUp", "Washing", "Ready", "OutForDelivery", "Delivered", "Cancelled"],
            default: "Draft",
        },
        orderVisibility: {
            type: String,
            enum: ["Draft", "Visible", "Cancelled"],
            default: "Draft",
            index: true,
        },

        statusHistory: [statusHistorySchema],
        itemsSubtotal: { type: Number, required: true },
        deliveryCharge: { type: Number, required: true, default: 0 },
        expressFee: { type: Number, required: true, default: 0 },
        deliveryDistanceKm: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },
        
        paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
        paymentMethod: { type: String, enum: ["UPI", "Card", "Cash", "Razorpay"], default: null },
        paidAt: { type: Date, default: null },
        razorpayOrderId: { type: String, default: null },
        razorpayPaymentId: { type: String, default: null },
        razorpaySignature: { type: String, default: null },

        rating: { type: Number, min: 1, max: 5, default: null },
        reviewComment: { type: String, default: null },

    },

    

    {timestamps: true}
);

module.exports = mongoose.model("Order", orderSchema);