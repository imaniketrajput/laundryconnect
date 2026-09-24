const express = require("express");
const router = express.Router();
const {
  createPartner,
  getPartners,
  getLiveLocations,
  getPartnerProfile,
  updatePartnerProfile,
} = require("../controllers/partnerController");
const { deleteAccount } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

router.post("/", protect, authorize("admin"), createPartner);
router.get("/live-locations", protect, authorize("admin"), getLiveLocations);
router.get("/profile", protect, authorize("partner"), getPartnerProfile);
router.put("/profile", protect, authorize("partner"), updatePartnerProfile);
router.delete("/profile", protect, authorize("partner"), deleteAccount);
router.get("/", protect, getPartners);

module.exports = router;