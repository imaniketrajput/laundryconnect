const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String },
    pricePerUnit: {type: Number, required: true},
    unit: { type: String, default: "kg" },
    description: { type: String },

});

module.exports = mongoose.model('Service', serviceSchema);
