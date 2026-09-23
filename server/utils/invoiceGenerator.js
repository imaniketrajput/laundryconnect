const PDFDocument = require("pdfkit");

/**
 * Builds the canonical normalized invoice data object.
 * This function serves as the SINGLE SOURCE OF TRUTH for:
 * 1. In-browser invoice modal & confirmation screen (JSON API)
 * 2. Generated PDF file download
 * 3. Email receipt attachment (Nodemailer Gmail SMTP)
 */
const buildInvoiceData = (order) => {
  if (!order) {
    throw new Error("Order is required to build invoice data");
  }

  const customerObj = order.customer || {};
  const customerName = customerObj.name || "Valued Customer";
  const customerEmail = customerObj.email || "";
  const customerPhone = customerObj.phone || "";
  const pickupAddress = order.pickupAddress || customerObj.address || "Address provided during booking";

  const orderId = order._id ? order._id.toString() : "ORDER";
  const invoiceId = `INV-${orderId.slice(-8).toUpperCase()}`;

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-IN");

  const paidAtDate = order.paidAt
    ? new Date(order.paidAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : orderDate;

  const items = (order.services || []).map((item) => {
    const serviceName = item.service?.name || item.name || "Custom Laundry Service";
    const quantity = item.quantity || 1;
    const unit = item.service?.unit || item.unit || "item";
    const pricePerUnit = item.service?.pricePerUnit ?? item.pricePerUnit ?? 0;
    const lineTotal = pricePerUnit * quantity;

    return {
      name: serviceName,
      quantity,
      unit,
      pricePerUnit,
      lineTotal,
    };
  });

  const itemsSubtotal = order.itemsSubtotal !== undefined ? order.itemsSubtotal : order.totalAmount;
  const deliveryCharge = order.deliveryCharge !== undefined ? order.deliveryCharge : 0;
  const expressFee = order.expressFee !== undefined ? order.expressFee : (order.isExpress ? 150 : 0);
  const totalAmount = order.totalAmount;

  return {
    invoiceId,
    orderId,
    orderDate,
    paidAt: paidAtDate,
    paymentStatus: order.paymentStatus || "Paid",
    paymentMethod: order.paymentMethod || "Razorpay",
    transactionId: order.razorpayPaymentId || "Verified",
    razorpayOrderId: order.razorpayOrderId || "N/A",
    isExpress: !!order.isExpress,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      address: pickupAddress,
    },
    company: {
      name: "LaundryConnect",
      tagline: "Professional Fabric Care · Smart Pickup & Delivery",
      email: "as.thakuraniket@gmail.com",
      phone: "+91 86508 65586",
      coverage: "48+ Cities, India",
      website: "https://laundryconnect.onrender.com",
    },
    items,
    itemsSubtotal,
    deliveryCharge,
    expressFee,
    totalAmount,
    taxNote: "All prices are inclusive of applicable taxes. Taxes are not separately itemized.",
    termsNote: "Thank you for choosing LaundryConnect. This is a computer-generated tax invoice and requires no physical signature.",
  };
};

/**
 * Generates an authoritative, beautifully formatted PDF document buffer using PDFKit.
 * @param {Object} order - Populated Mongoose order document or plain object
 * @returns {Promise<Buffer>}
 */
const generateInvoicePdf = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const data = buildInvoiceData(order);
      const doc = new PDFDocument({ margin: 40, size: "A4" });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      const primaryColor = "#0f172a"; // Navy
      const accentColor = "#d97706"; // Amber 600 (high contrast for PDF print)
      const textMuted = "#475569";
      const borderColor = "#cbd5e1";

      // ── 1. Header & Brand ──────────────────────────────────────────────────
      doc.fontSize(24).font("Helvetica-Bold").fillColor(primaryColor).text("Laundry", 40, 40, { continued: true });
      doc.fillColor(accentColor).text("Connect");

      doc.fontSize(9).font("Helvetica").fillColor(textMuted).text(data.company.tagline, 40, 68);

      // Company details on right
      doc.fontSize(8).font("Helvetica").fillColor(textMuted);
      doc.text(data.company.email, 340, 42, { align: "right", width: 215 });
      doc.text(data.company.phone, 340, 54, { align: "right", width: 215 });
      doc.text(data.company.coverage, 340, 66, { align: "right", width: 215 });

      // Horizontal separator line
      doc.moveTo(40, 85).lineTo(555, 85).lineWidth(1.5).strokeColor(accentColor).stroke();

      // ── 2. Invoice Meta & Customer Details ─────────────────────────────────
      let y = 100;
      doc.fontSize(14).font("Helvetica-Bold").fillColor(primaryColor).text("TAX INVOICE", 40, y);

      y += 20;
      const leftColX = 40;
      const rightColX = 320;

      // Left Column: Invoice Metadata
      doc.fontSize(8).font("Helvetica-Bold").fillColor(textMuted).text("INVOICE ID", leftColX, y);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(primaryColor).text(data.invoiceId, leftColX, y + 10);

      doc.fontSize(8).font("Helvetica-Bold").fillColor(textMuted).text("ORDER ID", leftColX, y + 26);
      doc.fontSize(9).font("Helvetica").fillColor(primaryColor).text(data.orderId, leftColX, y + 36);

      doc.fontSize(8).font("Helvetica-Bold").fillColor(textMuted).text("INVOICE DATE", leftColX, y + 52);
      doc.fontSize(9).font("Helvetica").fillColor(primaryColor).text(data.paidAt || data.orderDate, leftColX, y + 62);

      doc.fontSize(8).font("Helvetica-Bold").fillColor(textMuted).text("PAYMENT METHOD & ID", leftColX, y + 78);
      doc.fontSize(9).font("Helvetica").fillColor(primaryColor).text(`${data.paymentMethod} (${data.transactionId})`, leftColX, y + 88);

      // Right Column: Customer Info
      doc.fontSize(8).font("Helvetica-Bold").fillColor(textMuted).text("BILLED TO", rightColX, y);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(primaryColor).text(data.customer.name, rightColX, y + 10);

      let custY = y + 24;
      if (data.customer.phone) {
        doc.fontSize(8.5).font("Helvetica").fillColor(textMuted).text(`Phone: ${data.customer.phone}`, rightColX, custY);
        custY += 12;
      }
      if (data.customer.email) {
        doc.fontSize(8.5).font("Helvetica").fillColor(textMuted).text(`Email: ${data.customer.email}`, rightColX, custY);
        custY += 12;
      }
      doc.fontSize(8.5).font("Helvetica").fillColor(textMuted).text(`Pickup: ${data.customer.address}`, rightColX, custY, { width: 235 });

      // Status Badge
      const badgeY = y + 82;
      doc.rect(rightColX, badgeY, 80, 18).fillAndStroke("#ecfdf5", "#10b981");
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#047857").text("STATUS: PAID", rightColX + 8, badgeY + 5);

      // ── 3. Line Items Table ───────────────────────────────────────────────
      const tableTop = 220;
      doc.rect(40, tableTop, 515, 22).fill("#f1f5f9");

      doc.fontSize(8.5).font("Helvetica-Bold").fillColor(primaryColor);
      doc.text("SERVICE DESCRIPTION", 50, tableTop + 6);
      doc.text("QTY / UNIT", 280, tableTop + 6, { align: "center", width: 70 });
      doc.text("RATE (INR)", 360, tableTop + 6, { align: "right", width: 80 });
      doc.text("SUBTOTAL (INR)", 455, tableTop + 6, { align: "right", width: 90 });

      let currentY = tableTop + 26;
      doc.font("Helvetica").fontSize(8.5);

      data.items.forEach((item) => {
        doc.fillColor(primaryColor).text(item.name, 50, currentY, { width: 220 });
        doc.fillColor(textMuted).text(`${item.quantity} ${item.unit}`, 280, currentY, { align: "center", width: 70 });
        doc.text(`₹${item.pricePerUnit.toFixed(2)}`, 360, currentY, { align: "right", width: 80 });
        doc.fillColor(primaryColor).text(`₹${item.lineTotal.toFixed(2)}`, 455, currentY, { align: "right", width: 90 });

        currentY += 20;
        doc.moveTo(40, currentY - 4).lineTo(555, currentY - 4).lineWidth(0.5).strokeColor(borderColor).stroke();
      });

      // ── 4. Cost Breakdown Box ─────────────────────────────────────────────
      currentY += 10;
      const summaryX = 330;
      const valX = 455;
      const valWidth = 90;

      doc.fontSize(9).font("Helvetica").fillColor(textMuted);
      doc.text("Items Subtotal:", summaryX, currentY);
      doc.fillColor(primaryColor).text(`₹${data.itemsSubtotal.toFixed(2)}`, valX, currentY, { align: "right", width: valWidth });

      currentY += 16;
      doc.fillColor(textMuted).text("Delivery Charge:", summaryX, currentY);
      doc.fillColor(primaryColor).text(data.deliveryCharge > 0 ? `₹${data.deliveryCharge.toFixed(2)}` : "FREE", valX, currentY, { align: "right", width: valWidth });

      if (data.isExpress) {
        currentY += 16;
        doc.fillColor(accentColor).font("Helvetica-Bold").text("⚡ Express Delivery Fee:", summaryX, currentY);
        doc.text(`+₹${data.expressFee.toFixed(2)}`, valX, currentY, { align: "right", width: valWidth });
      }

      currentY += 18;
      // Grand Total Highlight Bar
      doc.rect(summaryX - 10, currentY - 4, 235, 26).fill("#f8fafc");
      doc.rect(summaryX - 10, currentY - 4, 235, 26).lineWidth(1).strokeColor(accentColor).stroke();

      doc.fontSize(10).font("Helvetica-Bold").fillColor(primaryColor).text("Total Amount Paid:", summaryX, currentY + 4);
      doc.fontSize(12).font("Helvetica-Bold").fillColor(accentColor).text(`₹${data.totalAmount.toFixed(2)}`, valX, currentY + 3, { align: "right", width: valWidth });

      // ── 5. Legal / Tax Disclaimer & Footer ─────────────────────────────────
      currentY += 50;
      doc.rect(40, currentY, 515, 45).fill("#f8fafc");
      doc.rect(40, currentY, 515, 45).lineWidth(0.5).strokeColor(borderColor).stroke();

      doc.fontSize(7.5).font("Helvetica").fillColor(textMuted);
      doc.text(`Note: ${data.taxNote}`, 50, currentY + 8, { width: 495 });
      doc.text(data.termsNote, 50, currentY + 22, { width: 495 });

      // Bottom copyright bar
      doc.fontSize(7.5).font("Helvetica").fillColor(textMuted).text(
        `© ${new Date().getFullYear()} LaundryConnect. All rights reserved. Registered across 48+ cities in India.`,
        40,
        780,
        { align: "center", width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  buildInvoiceData,
  generateInvoicePdf,
};
