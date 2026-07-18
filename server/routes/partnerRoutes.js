const express = require("express");
const router = express.Router();
const {createPartner, getPartners} = require("../controllers/partnerController");
const {protect, authorize} = require("../middleware/auth");

router.post("/", protect, authorize("admin"), createPartner);
router.get("/", protect, getPartners);

module.exports = router;