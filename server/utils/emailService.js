const { Resend } = require("resend");
const User = require("../models/User");
const Order = require("../models/Order");

// ─── Resend Client Initializer ───────────────────────────────────────────────
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_placeholder" || apiKey.trim() === "") {
    return null;
  }
  return new Resend(apiKey);
};

// ─── Helper: Resolve Customer Info ──────────────────────────────────────────
const resolveCustomer = async (user, order) => {
  try {
    if (user && user.email) return user;

    // Check if user is an ID or if order has customer ID/object
    const customerId = (user && (user.id || user._id)) || (order && order.customer);
    if (!customerId) return null;

    if (typeof customerId === "object" && customerId.email) {
      return customerId;
    }

    const dbUser = await User.findById(customerId).select("name email phone address");
    return dbUser;
  } catch (err) {
    console.error("[EmailService] Failed to resolve customer:", err.message);
    return null;
  }
};

// ─── Helper: Resolve Populated Order ─────────────────────────────────────────
const resolveOrderWithServices = async (order) => {
  try {
    if (!order) return null;
    const orderId = order._id || order;
    
    // If services are already populated with service names, reuse
    if (order.services && order.services.length > 0 && order.services[0].service?.name) {
      return order;
    }

    const populated = await Order.findById(orderId)
      .populate("services.service")
      .populate("customer", "name email");

    return populated || order;
  } catch (err) {
    console.error("[EmailService] Failed to populate order:", err.message);
    return order;
  }
};

// ─── Shared Base HTML Email Template Layout ──────────────────────────────────
const renderEmailLayout = ({ title, preheader, contentHtml }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0a0f1d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; }
    a { color: #f59e0b; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0f1d; -webkit-font-smoothing: antialiased;">
  <!-- Hidden preheader text for email clients -->
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; color: transparent; font-size: 1px;">
    ${preheader || title}
  </div>

  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0a0f1d; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #111827; border-radius: 16px; border: 1px solid #1f2937; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; border-bottom: 2px solid #f59e0b;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Laundry<span style="color: #f59e0b;">Connect</span></span>
                    <span style="display: inline-block; margin-left: 10px; padding: 3px 8px; border-radius: 10px; background-color: rgba(245, 158, 11, 0.12); color: #f59e0b; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid rgba(245, 158, 11, 0.25);">Smart Care</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">24-Hr Doorstep Care</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic Body Content -->
          <tr>
            <td style="padding: 32px 32px; color: #e2e8f0; font-size: 14px; line-height: 1.6;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Brand Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0b0f19; border-top: 1px solid #1f2937; text-align: center; color: #64748b; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 8px 0; color: #94a3b8; font-weight: 600;">
                LaundryConnect &bull; Smart Laundry Pickup &amp; Delivery
              </p>
              <p style="margin: 0 0 12px 0;">
                Need help or have questions about your fabric care? Reply directly or email <a href="mailto:support@laundryconnect.com" style="color: #f59e0b; font-weight: 600;">support@laundryconnect.com</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${new Date().getFullYear()} LaundryConnect. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

// ─── Safe Dispatch Wrapper (Never Throws) ────────────────────────────────────
const safeSendEmail = async ({ to, subject, html, emailType, attachments }) => {
  try {
    if (!to) {
      console.warn(`[EmailService] Cannot send ${emailType}: No recipient email provided.`);
      return { success: false, reason: "No recipient email" };
    }

    const resend = getResendClient();
    if (!resend) {
      const attachInfo = attachments && attachments.length > 0 ? ` with ${attachments.length} attachment(s)` : "";
      console.log(`[EmailService] RESEND_API_KEY is not configured or placeholder. Simulated ${emailType}${attachInfo} to <${to}>: "${subject}"`);
      return { success: true, simulated: true };
    }

    const fromAddress = process.env.RESEND_FROM_EMAIL || "LaundryConnect <onboarding@resend.dev>";

    const sendPayload = {
      from: fromAddress,
      to: [to],
      subject,
      html,
    };

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      sendPayload.attachments = attachments;
    }

    const { data, error } = await resend.emails.send(sendPayload);

    if (error) {
      console.error(`[EmailService] Resend error for ${emailType} to <${to}>:`, error);
      return { success: false, error };
    }

    console.log(`[EmailService] Successfully sent ${emailType} to <${to}> (ID: ${data.id})`);
    return { success: true, data };
  } catch (err) {
    console.error(`[EmailService] Unexpected failure in safeSendEmail (${emailType}):`, err.message);
    return { success: false, error: err.message };
  }
};

// ─── 1. Send Welcome Email ──────────────────────────────────────────────────
exports.sendWelcomeEmail = async (user) => {
  try {
    const customer = await resolveCustomer(user);
    if (!customer || !customer.email) {
      console.warn("[EmailService] sendWelcomeEmail aborted: Missing customer email");
      return;
    }

    const firstName = customer.name ? customer.name.split(" ")[0] : "there";

    const contentHtml = `
      <h1 style="margin: 0 0 16px 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">
        Welcome to LaundryConnect, ${firstName}! ✨
      </h1>
      <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
        We're thrilled to welcome you to the future of smart fabric care. From everyday wash &amp; fold to delicate garment dry cleaning, we handle your laundry with precision care and door-to-door convenience.
      </p>

      <!-- Highlights Box -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; margin: 20px 0 28px 0;">
        <tr>
          <td style="padding: 20px 24px;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom: 14px;">
                  <span style="font-size: 16px; margin-right: 8px;">🚚</span>
                  <strong style="color: #ffffff; font-size: 14px;">Free Scheduled Doorstep Pickup</strong>
                  <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">We pick up directly from your doorstep at your chosen slot.</div>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 14px;">
                  <span style="font-size: 16px; margin-right: 8px;">⚡</span>
                  <strong style="color: #ffffff; font-size: 14px;">24-Hour Express Turnaround</strong>
                  <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">Urgent laundry? Our express service gets it back within 24 hours.</div>
                </td>
              </tr>
              <tr>
                <td>
                  <span style="font-size: 16px; margin-right: 8px;">📍</span>
                  <strong style="color: #ffffff; font-size: 14px;">Live Status &amp; Driver Tracking</strong>
                  <div style="color: #94a3b8; font-size: 12px; margin-top: 2px;">Track your garment's journey in real time with our live status timeline.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 12px 0;">
        <tr>
          <td align="center">
            <a href="http://localhost:5173/services" style="display: inline-block; background-color: #f59e0b; color: #0a0f1d; font-size: 14px; font-weight: 800; padding: 14px 32px; border-radius: 10px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);">
              Book Your First Pickup
            </a>
          </td>
        </tr>
      </table>
    `;

    const html = renderEmailLayout({
      title: "Welcome to LaundryConnect",
      preheader: "Your smart doorstep laundry and dry cleaning care starts here.",
      contentHtml,
    });

    await safeSendEmail({
      to: customer.email,
      subject: `✨ Welcome to LaundryConnect, ${firstName}!`,
      html,
      emailType: "Welcome Email",
    });
  } catch (err) {
    console.error("[EmailService] sendWelcomeEmail caught error:", err.message);
  }
};

// ─── 2. Send Order Confirmation Email ────────────────────────────────────────
exports.sendOrderConfirmationEmail = async (order, user) => {
  try {
    const customer = await resolveCustomer(user, order);
    const populatedOrder = await resolveOrderWithServices(order);

    if (!customer || !customer.email) {
      console.warn("[EmailService] sendOrderConfirmationEmail aborted: Missing customer email");
      return;
    }

    const orderRef = populatedOrder._id ? populatedOrder._id.toString().slice(-8).toUpperCase() : "ORDER";
    const pickupDateStr = populatedOrder.pickupDate ? new Date(populatedOrder.pickupDate).toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    }) : "Scheduled";

    // Itemized services table
    const serviceRows = (populatedOrder.services || []).map(item => {
      const name = item.service?.name || "Laundry Service";
      const unit = item.service?.unit || "item";
      const rate = item.service?.pricePerUnit ? `₹${item.service.pricePerUnit}/${unit}` : "";
      const subtotal = item.service?.pricePerUnit ? `₹${item.service.pricePerUnit * item.quantity}` : "";
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #334155; color: #ffffff; font-weight: 500;">
            ${name} <span style="color: #94a3b8; font-size: 12px;">(${item.quantity} ${unit}${item.quantity > 1 ? 's' : ''})</span>
          </td>
          <td align="right" style="padding: 10px 0; border-bottom: 1px solid #334155; color: #f59e0b; font-weight: 700;">
            ${subtotal || rate}
          </td>
        </tr>
      `;
    }).join("");

    const contentHtml = `
      <div style="background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px 8px 8px 4px; margin-bottom: 24px;">
        <span style="color: #f59e0b; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Order Placed Successfully</span>
        <h2 style="margin: 4px 0 0 0; color: #ffffff; font-size: 18px; font-weight: 800;">Order #${orderRef}</h2>
      </div>

      <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 14px;">
        Hello <strong>${customer.name || "Customer"}</strong>, thank you for choosing LaundryConnect. We have received your pickup request and our team is prepping for collection.
      </p>

      <!-- Order Summary Card -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin: 20px 0;">
        <tr>
          <td>
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
              <tr>
                <td style="color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 700;">Pickup Details</td>
                <td align="right">
                  ${populatedOrder.isExpress ? 
                    '<span style="background-color: rgba(245, 158, 11, 0.2); color: #f59e0b; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.3);">⚡ 24-Hr Express</span>' : 
                    '<span style="background-color: rgba(148, 163, 184, 0.2); color: #cbd5e1; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px;">Standard Care</span>'
                  }
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 8px; color: #ffffff; font-size: 13px;">
                  📅 <strong>Date:</strong> ${pickupDateStr}
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top: 4px; color: #ffffff; font-size: 13px;">
                  📍 <strong>Address:</strong> ${populatedOrder.pickupAddress || "Provided during booking"}
                </td>
              </tr>
            </table>

            <!-- Itemized list -->
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #334155; padding-top: 10px; margin-top: 10px;">
              ${serviceRows}
              <tr>
                <td style="padding-top: 10px; color: #94a3b8; font-size: 13px;">Items Subtotal</td>
                <td align="right" style="padding-top: 10px; color: #ffffff; font-size: 13px; font-weight: 600;">₹${populatedOrder.itemsSubtotal ?? populatedOrder.totalAmount}</td>
              </tr>
              <tr>
                <td style="padding-top: 6px; color: #94a3b8; font-size: 13px;">Delivery Charge</td>
                <td align="right" style="padding-top: 6px; color: #ffffff; font-size: 13px; font-weight: 600;">${populatedOrder.deliveryCharge ? '₹' + populatedOrder.deliveryCharge : 'FREE'}</td>
              </tr>
              ${populatedOrder.isExpress ? `
              <tr>
                <td style="padding-top: 6px; color: #f59e0b; font-size: 13px;">⚡ Express Service Fee</td>
                <td align="right" style="padding-top: 6px; color: #f59e0b; font-size: 13px; font-weight: 700;">+₹${populatedOrder.expressFee || 150}</td>
              </tr>` : ''}
              <tr style="border-top: 1px solid #334155;">
                <td style="padding-top: 12px; color: #ffffff; font-size: 15px; font-weight: 800;">
                  Total Amount
                </td>
                <td align="right" style="padding-top: 12px; color: #f59e0b; font-size: 20px; font-weight: 900;">
                  ₹${populatedOrder.totalAmount}
                </td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 12px; padding-top: 4px;">Payment Status</td>
                <td align="right" style="color: ${populatedOrder.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'}; font-size: 12px; font-weight: 700; padding-top: 4px;">
                  ${populatedOrder.paymentStatus || 'Pending'}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 12px 0;">
        <tr>
          <td align="center">
            <a href="http://localhost:5173/orders" style="display: inline-block; background-color: #f59e0b; color: #0a0f1d; font-size: 13px; font-weight: 800; padding: 12px 28px; border-radius: 10px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
              View &amp; Track Your Order
            </a>
          </td>
        </tr>
      </table>
    `;

    const html = renderEmailLayout({
      title: `Order Confirmation #${orderRef}`,
      preheader: `Your order #${orderRef} has been placed for ₹${populatedOrder.totalAmount}.`,
      contentHtml,
    });

    await safeSendEmail({
      to: customer.email,
      subject: `📦 Order Confirmed #${orderRef} — LaundryConnect`,
      html,
      emailType: "Order Confirmation Email",
    });
  } catch (err) {
    console.error("[EmailService] sendOrderConfirmationEmail caught error:", err.message);
  }
};

// ─── 3. Send Payment Receipt Email ───────────────────────────────────────────
exports.sendPaymentReceiptEmail = async (order, user, invoice, pdfBuffer) => {
  try {
    const customer = await resolveCustomer(user, order);
    const populatedOrder = await resolveOrderWithServices(order);

    if (!customer || !customer.email) {
      console.warn("[EmailService] sendPaymentReceiptEmail aborted: Missing customer email");
      return;
    }

    const orderRef = populatedOrder._id ? populatedOrder._id.toString().slice(-8).toUpperCase() : "ORDER";
    const paymentId = populatedOrder.razorpayPaymentId || (invoice && invoice.transactionId) || "Verified";
    const paidAtStr = populatedOrder.paidAt ? new Date(populatedOrder.paidAt).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    }) : new Date().toLocaleDateString("en-IN");

    // Resolve or generate PDF buffer if not passed directly
    let invoiceBuffer = pdfBuffer;
    if (!invoiceBuffer) {
      try {
        const { generateInvoicePdf } = require("./invoiceGenerator");
        invoiceBuffer = await generateInvoicePdf(populatedOrder);
      } catch (pdfErr) {
        console.warn("[EmailService] Could not auto-generate PDF buffer for email attachment:", pdfErr.message);
      }
    }

    const attachments = [];
    if (invoiceBuffer && Buffer.isBuffer(invoiceBuffer)) {
      attachments.push({
        filename: `Invoice-INV-${orderRef}.pdf`,
        content: invoiceBuffer,
      });
    }

    const contentHtml = `
      <!-- Success Badge Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background-color: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; color: #10b981; font-size: 24px; text-align: center;">
          ✓
        </div>
        <h2 style="margin: 12px 0 4px 0; color: #ffffff; font-size: 20px; font-weight: 800;">Payment Successful!</h2>
        <p style="margin: 0; color: #10b981; font-size: 13px; font-weight: 700;">₹${populatedOrder.totalAmount} Received via ${populatedOrder.paymentMethod || 'Razorpay'}</p>
      </div>

      <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 14px;">
        Hello <strong>${customer.name || "Customer"}</strong>, your payment for Order <strong>#${orderRef}</strong> has been verified and processed successfully. Your official tax invoice has been generated and is attached as a PDF to this email.
      </p>

      <!-- Transaction Details Box -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 20px; margin: 20px 0;">
        <tr>
          <td>
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color: #94a3b8; font-size: 12px; padding-bottom: 8px;">Order Reference</td>
                <td align="right" style="color: #ffffff; font-size: 13px; font-weight: 700; padding-bottom: 8px;">#${orderRef}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 12px; padding-bottom: 8px;">Transaction / Payment ID</td>
                <td align="right" style="color: #f59e0b; font-size: 12px; font-family: monospace; font-weight: 700; padding-bottom: 8px;">${paymentId}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 12px; padding-bottom: 8px;">Payment Gateway</td>
                <td align="right" style="color: #ffffff; font-size: 13px; font-weight: 600; padding-bottom: 8px;">${populatedOrder.paymentMethod || 'Razorpay'}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 12px; padding-bottom: 8px;">Date &amp; Time Paid</td>
                <td align="right" style="color: #ffffff; font-size: 13px; padding-bottom: 8px;">${paidAtStr}</td>
              </tr>
              <tr style="border-top: 1px solid #334155;">
                <td style="color: #94a3b8; font-size: 12px; padding-top: 10px;">Items Subtotal</td>
                <td align="right" style="color: #ffffff; font-size: 13px; font-weight: 600; padding-top: 10px;">₹${populatedOrder.itemsSubtotal ?? populatedOrder.totalAmount}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 12px; padding-top: 6px;">Delivery Charge</td>
                <td align="right" style="color: #ffffff; font-size: 13px; font-weight: 600; padding-top: 6px;">${populatedOrder.deliveryCharge ? '₹' + populatedOrder.deliveryCharge : 'FREE'}</td>
              </tr>
              ${populatedOrder.isExpress ? `
              <tr>
                <td style="color: #f59e0b; font-size: 12px; padding-top: 6px;">⚡ Express Service Fee</td>
                <td align="right" style="color: #f59e0b; font-size: 13px; font-weight: 700; padding-top: 6px;">+₹${populatedOrder.expressFee || 150}</td>
              </tr>` : ''}
              <tr style="border-top: 1px solid #334155;">
                <td style="color: #ffffff; font-size: 15px; font-weight: 800; padding-top: 12px;">Total Paid</td>
                <td align="right" style="color: #10b981; font-size: 20px; font-weight: 900; padding-top: 12px;">₹${populatedOrder.totalAmount}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- PDF Attachment Notice -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: rgba(245, 158, 11, 0.08); border-radius: 8px; border: 1px dashed rgba(245, 158, 11, 0.4); margin: 16px 0 24px 0;">
        <tr>
          <td style="padding: 12px 16px; font-size: 12px; color: #f59e0b; text-align: center;">
            📎 <strong>Official Invoice Attached:</strong> A printable PDF invoice (<code>Invoice-INV-${orderRef}.pdf</code>) is attached to this email.
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 20px 0 12px 0;">
        <tr>
          <td align="center">
            <a href="http://localhost:5173/orders" style="display: inline-block; background-color: #f59e0b; color: #0a0f1d; font-size: 13px; font-weight: 800; padding: 12px 28px; border-radius: 10px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
              View Paid Order in App
            </a>
          </td>
        </tr>
      </table>
    `;

    const html = renderEmailLayout({
      title: `Payment Receipt #${orderRef}`,
      preheader: `Your payment of ₹${populatedOrder.totalAmount} for Order #${orderRef} was successful. Invoice attached.`,
      contentHtml,
    });

    await safeSendEmail({
      to: customer.email,
      subject: `💳 Payment Receipt for Order #${orderRef} — LaundryConnect`,
      html,
      emailType: "Payment Receipt Email",
      attachments,
    });
  } catch (err) {
    console.error("[EmailService] sendPaymentReceiptEmail caught error:", err.message);
  }
};

// ─── 4. Send Status Update Email (OutForDelivery & Delivered ONLY) ────────────
exports.sendStatusUpdateEmail = async (order, user, newStatus) => {
  try {
    // Only send on specific critical milestones to prevent inbox fatigue
    if (newStatus !== "OutForDelivery" && newStatus !== "Delivered") {
      return;
    }

    const customer = await resolveCustomer(user, order);
    const populatedOrder = await resolveOrderWithServices(order);

    if (!customer || !customer.email) {
      console.warn("[EmailService] sendStatusUpdateEmail aborted: Missing customer email");
      return;
    }

    const orderRef = populatedOrder._id ? populatedOrder._id.toString().slice(-8).toUpperCase() : "ORDER";
    const isDelivery = newStatus === "Delivered";

    const badgeText = isDelivery ? "Delivered" : "Out For Delivery";
    const badgeColor = isDelivery ? "#10b981" : "#f97316";
    const badgeBg = isDelivery ? "rgba(16, 185, 129, 0.15)" : "rgba(249, 115, 22, 0.15)";
    const headline = isDelivery ? "Your Clean Clothes Have Been Delivered! ✨" : "Your Laundry is Out for Delivery! 🚚";
    const subject = isDelivery 
      ? `✨ Order Delivered! #${orderRef} — LaundryConnect`
      : `🚚 Out for Delivery! #${orderRef} — LaundryConnect`;

    const messageBody = isDelivery
      ? "Your LaundryConnect order has been safely delivered to your doorstep. Every garment has been professionally cared for, crisp and ready to wear. We hope you love the results!"
      : "Great news! Our delivery partner has collected your freshly cleaned, folded, and inspected garments and is on their way to your delivery address.";

    const contentHtml = `
      <!-- Status Badge Header -->
      <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${badgeText}
        </span>
        <h2 style="margin: 10px 0 6px 0; color: #ffffff; font-size: 20px; font-weight: 800;">${headline}</h2>
        <p style="margin: 0; color: #94a3b8; font-size: 13px;">Order #${orderRef}</p>
      </div>

      <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
        Hello <strong>${customer.name || "Customer"}</strong>, ${messageBody}
      </p>

      <!-- Order Info Box -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 18px; margin: 20px 0;">
        <tr>
          <td>
            <table width="100%" border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color: #94a3b8; font-size: 12px;">Delivery Address</td>
                <td align="right" style="color: #ffffff; font-size: 13px; font-weight: 600;">${populatedOrder.pickupAddress || "On file"}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 12px; padding-top: 8px;">Order Total</td>
                <td align="right" style="color: #f59e0b; font-size: 14px; font-weight: 800; padding-top: 8px;">₹${populatedOrder.totalAmount}</td>
              </tr>
              <tr>
                <td style="color: #94a3b8; font-size: 12px; padding-top: 8px;">Payment Status</td>
                <td align="right" style="color: ${populatedOrder.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'}; font-size: 12px; font-weight: 700; padding-top: 8px;">
                  ${populatedOrder.paymentStatus || 'Pending'}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 24px 0 12px 0;">
        <tr>
          <td align="center">
            <a href="http://localhost:5173/orders" style="display: inline-block; background-color: #f59e0b; color: #0a0f1d; font-size: 13px; font-weight: 800; padding: 12px 28px; border-radius: 10px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
              ${isDelivery ? "Rate Your Experience &amp; View Order" : "Track Driver &amp; Delivery"}
            </a>
          </td>
        </tr>
      </table>
    `;

    const html = renderEmailLayout({
      title: subject,
      preheader: isDelivery ? `Your order #${orderRef} has been delivered.` : `Your order #${orderRef} is on the way.`,
      contentHtml,
    });

    await safeSendEmail({
      to: customer.email,
      subject,
      html,
      emailType: `Status Update Email (${newStatus})`,
    });
  } catch (err) {
    console.error("[EmailService] sendStatusUpdateEmail caught error:", err.message);
  }
};
