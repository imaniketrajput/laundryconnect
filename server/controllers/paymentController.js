const Order = require("../models/Order");


exports.payForOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethod } = req.body; 

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });


    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to pay for this order" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    
    order.paymentStatus = "Paid";
    order.paymentMethod = paymentMethod || "UPI";
    order.paidAt = new Date();
    await order.save();

    res.json({ message: "Payment successful", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Generate a structured invoice for a paid order
exports.getInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("services.service")
      .populate("customer", "name email phone address");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Invoice only available for paid orders" });
    }

    const invoice = {
      invoiceId: `INV-${order._id.toString().slice(-8).toUpperCase()}`,
      orderId: order._id,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      pickupAddress: order.pickupAddress,
      items: order.services.map((item) => ({
        name: item.service.name,
        quantity: item.quantity,
        unit: item.service.unit,
        pricePerUnit: item.service.pricePerUnit,
        subtotal: item.service.pricePerUnit * item.quantity,
      })),
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
      isExpress: order.isExpress,
    };

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};