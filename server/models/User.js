const mongoose = require('mongoose');

const savedAddressSchema = new mongoose.Schema(
    {
        label: { type: String, default: "Home" }, // e.g. "Home", "Work", "Other"
        fullAddress: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        isDefault: { type: Boolean, default: false },
    },
    { _id: true, timestamps: true }
);

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: {
            type: String,
            required: function () {
                return !this.googleId;
            },
        },
        googleId: {
            type: String,
            sparse: true,
            unique: true,
        },
        role: { type: String, enum: ["customer", "partner", "admin"], default: "customer" },
        phone: { type: String },
        address: { type: String },
        profilePhoto: { type: String, default: null }, // Base64 data URL or Google picture URL
        savedAddresses: [savedAddressSchema],
        dateOfBirth: { type: String, default: null },
        gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say", null], default: null },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Schema-level validation: user must have either password or googleId
userSchema.pre('validate', function () {
    if (!this.password && !this.googleId) {
        throw new Error('User must have either a password or a googleId');
    }
});


module.exports = mongoose.model('User', userSchema);