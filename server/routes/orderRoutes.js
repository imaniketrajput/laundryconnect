const express = require("express");
const router = express.Router();
const { submitReview } = require("../controllers/reviewController");
const {
    createOrder, 
    getMyOrders, 
    getOrderById,
    getOrderQueue,
    getNextOrder,
    getOptimizedRoute,
    estimateDeliveryFee,
} = require("../controllers/orderController");
const {protect, authorize} = require("../middleware/auth");
const { updateOrderStatus } = require("../controllers/orderController");



router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/estimate-delivery", protect, estimateDeliveryFee);
router.get("/queue", protect, authorize("admin", "partner"), getOrderQueue);
router.get("/queue/next", protect, authorize("admin", "partner"), getNextOrder);
router.get("/:id", protect, getOrderById);
router.post("/optimize-route", protect, authorize("admin", "partner"), getOptimizedRoute);
router.post("/:id/review", protect, submitReview);
router.patch("/:id/status", protect, authorize("admin", "partner"), updateOrderStatus);

module.exports = router;