const Order = require("../models/Order");
const DeliveryPartner = require("../models/DeliveryPartner");
const Message = require("../models/Message");

/**
 * GET /api/orders/:id/messages
 * Fetches message history for an order from the separate chat database.
 * Sorted oldest-first.
 *
 * Authorization:
 * Requester must be either:
 * 1. The customer who placed the order (order.customer === req.user.id)
 * 2. The delivery partner assigned to the order (order.assignedPartner === req.user.id OR matches their DeliveryPartner document)
 *
 * All other users are rejected with 403 Forbidden.
 */
exports.getMessages = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    // 1. Fetch order from main transactional database
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const userId = req.user.id || req.user._id?.toString();

    // 2. IDOR Authorization Check
    const isCustomer = order.customer && order.customer.toString() === userId.toString();

    let isAssignedPartner = false;
    if (order.assignedPartner) {
      if (order.assignedPartner.toString() === userId.toString()) {
        isAssignedPartner = true;
      } else {
        const partnerDoc = await DeliveryPartner.findOne({ user: userId });
        if (partnerDoc && order.assignedPartner.toString() === partnerDoc._id.toString()) {
          isAssignedPartner = true;
        }
      }
    }

    if (!isCustomer && !isAssignedPartner) {
      return res.status(403).json({ message: "Not authorized to access chat for this order" });
    }

    // 3. Graceful degradation if separate chat DB is offline or unconfigured
    if (!Message) {
      return res.status(503).json({ message: "Chat service is temporarily offline" });
    }

    // 4. Fetch messages from separate chat database, sorted oldest first
    const messages = await Message.find({ order: order._id }).sort({ createdAt: 1 });
    return res.json(messages);
  } catch (err) {
    console.error("[ChatOrderController] Error fetching chat messages:", err.message);
    return res.status(500).json({ message: err.message });
  }
};
