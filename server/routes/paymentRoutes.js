const express = require("express");
const router = express.Router();
const { 
  createRazorpayOrder, 
  verifyPayment, 
  payForOrder, 
  getInvoice,
  getInvoicePdf
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// Razorpay live payment endpoints
router.post("/:orderId/razorpay/create-order", protect, createRazorpayOrder);
router.post("/:orderId/razorpay/verify", protect, verifyPayment);

// Legacy and invoice endpoints
router.post("/:orderId/pay", protect, payForOrder);
router.get("/:orderId/invoice", protect, getInvoice);
router.get("/:orderId/invoice/pdf", protect, getInvoicePdf);

module.exports = router;