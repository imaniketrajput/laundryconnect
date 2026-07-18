const express = require("express");
const router = express.Router();

const {createService, getServices, searchServices} = require("../controllers/serviceController");
const {protect, authorize} = require("../middleware/auth");

router.get("/search", searchServices);
router.get("/", getServices);
router.post("/", protect, authorize("admin"), createService);


module.exports = router;