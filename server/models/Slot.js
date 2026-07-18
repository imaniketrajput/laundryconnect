const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    partner: {type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner"},
    date: {type: Date, required: true},
    startTime: {type: String, required: true},
    endTime: {type: String, required: true},
    order: {type: mongoose.Schema.Types.ObjectId, ref: "Order"},
});

module.exports = mongoose.model("Slot", slotSchema);