const Order = require("../models/Order");
const DeliveryPartner = require("../models/DeliveryPartner");

exports.submitReview = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to review this order" });
    }

    if (order.currentStatus !== "Delivered") {
      return res.status(400).json({ message: "Can only review delivered orders" });
    }

    if (order.rating) {
      return res.status(400).json({ message: "Order already reviewed" });
    }

    order.rating = rating;
    order.reviewComment = comment || "";
    await order.save();

    
    if (order.assignedPartner) {
      const partner = await DeliveryPartner.findById(order.assignedPartner);
      if (partner) {
        const deliveredReviewed = await Order.find({
          assignedPartner: partner._id,
          rating: { $ne: null },
        });
        const avg =
          deliveredReviewed.reduce((sum, o) => sum + o.rating, 0) / deliveredReviewed.length;
        partner.rating = Math.round(avg * 10) / 10; // round to 1 decimal
        await partner.save();
      }
    }

    res.json({ message: "Review submitted", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};