const User = require("../models/User");
const DeliveryPartner = require("../models/DeliveryPartner");
const Order = require("../models/Order");

/**
 * GET /api/users/profile
 * Returns authenticated user's profile details.
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let partnerData = null;
    if (user.role === "partner") {
      partnerData = await DeliveryPartner.findOne({ user: user._id });
    }

    res.json({
      user,
      partner: partnerData,
    });
  } catch (err) {
    console.error("[UserController:getProfile] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/users/profile
 * Updates personal profile fields: name, phone, dateOfBirth, gender.
 * Strictly forbids modifying the email address (defense in depth).
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, dateOfBirth, gender, email } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Security Guard: Email change prevention
    if (email && email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      return res.status(400).json({ message: "Email address cannot be changed." });
    }

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;

    await user.save();

    const updatedUser = await User.findById(req.user.id).select("-password");
    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("[UserController:updateProfile] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/users/profile/address
 * Manages customer saved delivery addresses: add, edit, delete, or mark default.
 */
exports.updateSavedAddresses = async (req, res) => {
  try {
    const { action, addressId, address } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.savedAddresses) {
      user.savedAddresses = [];
    }

    if (action === "add") {
      if (!address || !address.fullAddress || typeof address.lat !== "number" || typeof address.lng !== "number") {
        return res.status(400).json({ message: "Full address, latitude, and longitude are required." });
      }

      // If marked as default or first address, reset others
      const isDefault = !!address.isDefault || user.savedAddresses.length === 0;
      if (isDefault) {
        user.savedAddresses.forEach((a) => (a.isDefault = false));
      }

      user.savedAddresses.push({
        label: address.label || "Home",
        fullAddress: address.fullAddress.trim(),
        lat: address.lat,
        lng: address.lng,
        isDefault,
      });
    } else if (action === "edit") {
      const target = user.savedAddresses.id(addressId);
      if (!target) return res.status(404).json({ message: "Saved address not found" });

      if (address.fullAddress) target.fullAddress = address.fullAddress.trim();
      if (typeof address.lat === "number") target.lat = address.lat;
      if (typeof address.lng === "number") target.lng = address.lng;
      if (address.label) target.label = address.label;

      if (address.isDefault) {
        user.savedAddresses.forEach((a) => (a.isDefault = false));
        target.isDefault = true;
      }
    } else if (action === "delete") {
      const target = user.savedAddresses.id(addressId);
      if (!target) return res.status(404).json({ message: "Saved address not found" });

      const wasDefault = target.isDefault;
      user.savedAddresses.pull(addressId);

      // If we deleted the default and there are remaining addresses, set the first as default
      if (wasDefault && user.savedAddresses.length > 0) {
        user.savedAddresses[0].isDefault = true;
      }
    } else if (action === "setDefault") {
      const target = user.savedAddresses.id(addressId);
      if (!target) return res.status(404).json({ message: "Saved address not found" });

      user.savedAddresses.forEach((a) => (a.isDefault = false));
      target.isDefault = true;
    } else {
      return res.status(400).json({ message: "Invalid action. Supported: add, edit, delete, setDefault." });
    }

    await user.save();
    res.json({
      message: "Addresses updated successfully",
      savedAddresses: user.savedAddresses,
    });
  } catch (err) {
    console.error("[UserController:updateSavedAddresses] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/users/profile/photo
 * Uploads user profile photo as a Base64 string directly into MongoDB.
 */
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo || typeof photo !== "string") {
      return res.status(400).json({ message: "Valid photo data is required" });
    }

    // Guard: max 2MB base64 payload size
    if (photo.length > 2.5 * 1024 * 1024) {
      return res.status(400).json({ message: "Photo file exceeds maximum 2MB size limit." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profilePhoto = photo;
    await user.save();

    // If partner, also sync to DeliveryPartner
    if (user.role === "partner") {
      await DeliveryPartner.findOneAndUpdate({ user: user._id }, { profilePhoto: photo });
    }

    res.json({
      message: "Profile photo updated successfully",
      profilePhoto: user.profilePhoto,
    });
  } catch (err) {
    console.error("[UserController:uploadProfilePhoto] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/users/profile
 * Deletes or anonymizes the user account upon explicit user confirmation.
 * Historical orders are strictly preserved for financial auditing and receipts.
 */
exports.deleteAccount = async (req, res) => {
  try {
    const { confirmation } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Enforce explicit phrase confirmation
    if (!confirmation || (confirmation !== "DELETE" && confirmation !== user.email)) {
      return res.status(400).json({
        message: "Please type DELETE or your email address to confirm account deletion.",
      });
    }

    // Anonymize and deactivate user (GDPR / Audit standard: preserve financial audit trail without retaining PII)
    user.isActive = false;
    user.name = "Deleted Customer";
    user.phone = null;
    user.address = null;
    user.savedAddresses = [];
    user.profilePhoto = null;
    // Append timestamp to email so user can re-register with that email if desired
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    // If partner, deactivate partner listing
    if (user.role === "partner") {
      await DeliveryPartner.findOneAndUpdate(
        { user: user._id },
        { isAvailable: false, profilePhoto: null }
      );
    }

    res.json({
      message: "Your account has been deleted successfully. We hope to see you again.",
    });
  } catch (err) {
    console.error("[UserController:deleteAccount] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};
