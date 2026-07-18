const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema(
    {
        user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
        vehicleType: {type: String},
        currentLocation: {
            lat: Number,
            lng: Number,
        },
        isAvailable: {type: Boolean, default: true},
        rating: {type: Number, default: 5},
    },
    {timestamps: true}
);

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
