const express = require("express");
const router = express.Router();
const {bookSlot, getPartnerSlots} = require("../controllers/slotController");
const {protect, authorize} = require("../middleware/auth");


router.post("/", protect, authorize("admin", "partner"), bookSlot);
router.get("/", protect, getPartnerSlots);

module.exports = router;