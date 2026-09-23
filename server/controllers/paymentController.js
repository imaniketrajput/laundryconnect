const Order = require("../models/Order");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendPaymentReceiptEmail } = require("../utils/emailService");
const { buildInvoiceData, generateInvoicePdf } = require("../utils/invoiceGenerator");

// Helper to initialize Razorpay instance with environment variables
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured.");
  }

  if (key_id === "rzp_test_placeholder" || key_secret === "placeholder_secret") {
    throw new Error("Razorpay test keys in server/.env are currently set to placeholders. Please replace them with your actual Key ID (rzp_test_...) and Key Secret from dashboard.razorpay.com.");
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

// ─── 1. Create Razorpay Order ────────────────────────────────────────────────
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ownership check: must be the customer who placed the order
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to pay for this order" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Order is already paid" });
    }

    const razorpay = getRazorpayInstance();

    // Razorpay requires amount in paise (1 INR = 100 paise) as an integer
    const amountInPaise = Math.round(order.totalAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${order._id.toString().slice(-10)}`,
      notes: {
        laundryOrderId: order._id.toString(),
        customerId: req.user.id,
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save the created Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      laundryOrderId: order._id,
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    const message = 
      err.error?.description || 
      err.description || 
      err.message || 
      "Failed to create Razorpay order";
    const statusCode = err.statusCode || (err.message && err.message.includes("Razorpay") ? 400 : 500);
    res.status(statusCode).json({ message });
  }
};

// ─── 2. Verify Razorpay Payment Signature & Activate Order ──────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing Razorpay payment verification details" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ownership check
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to verify payment for this order" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Order is already marked as paid" });
    }

    // Security Check: Verify razorpay_order_id matches the order's generated Razorpay order ID
    if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: "Razorpay order ID mismatch. Verification failed." });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({ message: "Razorpay secret key is not configured on the server." });
    }

    // Standard Razorpay HMAC-SHA256 signature verification:
    // signature = hmac_sha256(order_id + "|" + payment_id, secret)
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
    const actualBuffer = Buffer.from(razorpay_signature, "utf-8");

    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      order.paymentStatus = "Failed";
      await order.save();
      return res.status(400).json({ message: "Invalid payment signature. Verification failed." });
    }

    // ── Payment is Authenticated & Valid ──
    // Activate order into system: Placed, Visible, Paid
    order.paymentStatus = "Paid";
    order.paymentMethod = "Razorpay";
    order.currentStatus = "Placed";
    order.orderVisibility = "Visible";
    order.paidAt = new Date();
    order.statusHistory.push({ status: "Placed", timestamp: new Date() });
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    // Populate for invoice generation and email
    const populatedOrder = await Order.findById(order._id)
      .populate("services.service")
      .populate("customer", "name email phone address");

    const invoice = buildInvoiceData(populatedOrder);

    // Asynchronously generate PDF and trigger payment receipt email
    generateInvoicePdf(populatedOrder)
      .then((pdfBuffer) => {
        sendPaymentReceiptEmail(populatedOrder, req.user, invoice, pdfBuffer).catch((err) => {
          console.error("[PaymentController] Failed to send payment receipt email:", err.message);
        });
      })
      .catch((err) => {
        console.error("[PaymentController] Failed to generate invoice PDF:", err.message);
        // Fallback: send email without PDF attachment if PDF generator failed
        sendPaymentReceiptEmail(populatedOrder, req.user, invoice, null).catch((emailErr) => {
          console.error("[PaymentController] Fallback payment receipt email also failed:", emailErr.message);
        });
      });

    res.json({ message: "Payment verified successfully", order: populatedOrder, invoice });
  } catch (err) {
    console.error("Razorpay payment verification error:", err);
    res.status(500).json({ message: err.message || "Payment verification failed" });
  }
};

// ─── 3. Legacy Mock Payment (Dev Testing Simulation) ─────────────────────────
exports.payForOrder = async (req, res) => {
  try {
    // Production Security Guard: test simulation is blocked in production
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ message: "Test payment simulation is disabled in production." });
    }

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
    order.paymentMethod = paymentMethod || "Razorpay";
    order.currentStatus = "Placed";
    order.orderVisibility = "Visible";
    order.paidAt = new Date();
    order.statusHistory.push({ status: "Placed", timestamp: new Date() });
    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate("services.service")
      .populate("customer", "name email phone address");

    const invoice = buildInvoiceData(populatedOrder);

    // Asynchronously generate PDF and trigger email
    generateInvoicePdf(populatedOrder)
      .then((pdfBuffer) => {
        sendPaymentReceiptEmail(populatedOrder, req.user, invoice, pdfBuffer).catch((err) => {
          console.error("[PaymentController] Failed to send mock payment receipt email:", err.message);
        });
      })
      .catch((err) => {
        console.error("[PaymentController] Failed to generate invoice PDF in mock:", err.message);
      });

    res.json({ message: "Payment successful", order: populatedOrder, invoice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── 4. Generate Structured JSON Invoice (Single Source of Truth) ────────────
exports.getInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("services.service")
      .populate("customer", "name email phone address");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // IDOR Check: Customer owner or privileged role
    const isOwner = order.customer._id.toString() === req.user.id;
    const isPrivileged = req.user.role === "admin" || req.user.role === "partner";
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "Not authorized to access this invoice" });
    }

    if (order.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Invoice only available for paid orders" });
    }

    const invoice = buildInvoiceData(order);
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── 5. Stream Authoritative PDF Invoice Download ────────────────────────────
exports.getInvoicePdf = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("services.service")
      .populate("customer", "name email phone address");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // IDOR Check: Customer owner or privileged role
    const isOwner = order.customer._id.toString() === req.user.id;
    const isPrivileged = req.user.role === "admin" || req.user.role === "partner";
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: "Not authorized to download this invoice" });
    }

    if (order.paymentStatus !== "Paid") {
      return res.status(400).json({ message: "Invoice PDF is only available for paid orders" });
    }

    const invoice = buildInvoiceData(order);
    const pdfBuffer = await generateInvoicePdf(order);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${invoice.invoiceId}.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF invoice streaming error:", err);
    res.status(500).json({ message: err.message || "Failed to generate invoice PDF" });
  }
};