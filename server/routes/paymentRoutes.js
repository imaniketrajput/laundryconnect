const express = require("express");
const router = express.Router();
const { payForOrder, getInvoice } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.post("/:orderId/pay", protect, payForOrder);
router.get("/:orderId/invoice", protect, getInvoice);

module.exports = router;