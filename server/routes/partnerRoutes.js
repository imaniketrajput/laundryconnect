const express = require("express");
const router = express.Router();
const {createPartner, getPartners, getLiveLocations} = require("../controllers/partnerController");
const {protect, authorize} = require("../middleware/auth");

router.post("/", protect, authorize("admin"), createPartner);
router.get("/live-locations", protect, authorize("admin"), getLiveLocations);
router.get("/", protect, getPartners);

module.exports = router;