const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  updateSavedAddresses,
  uploadProfilePhoto,
  deleteAccount,
} = require("../controllers/userController");

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/profile/address", protect, updateSavedAddresses);
router.post("/profile/photo", protect, uploadProfilePhoto);
router.delete("/profile", protect, deleteAccount);

module.exports = router;
