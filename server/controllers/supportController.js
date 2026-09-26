const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const SupportTicket = require('../models/SupportTicket');
const Order = require('../models/Order');
const {
  sendSupportTicketConfirmationEmail,
  sendSupportTicketAdminNotificationEmail,
} = require('../utils/emailService');

/**
 * 1. Create a new support ticket (Public, rate-limited)
 * POST /api/support/tickets
 */
exports.createTicket = async (req, res) => {
  try {
    const { name, email, subject, message, relatedOrderId } = req.body;

    // Input validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Optional user authentication deduction if bearer token exists
    let submittedBy = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && (decoded.id || decoded._id)) {
          submittedBy = decoded.id || decoded._id;
        }
      } catch {
        // Logged-out or expired token fallback is acceptable
      }
    }

    // Optional related order ID verification
    let validOrderId = null;
    if (relatedOrderId && typeof relatedOrderId === 'string' && relatedOrderId.trim()) {
      const cleanOrderId = relatedOrderId.trim();
      if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
        // Verify order exists if valid ObjectId
        const orderExists = await Order.findById(cleanOrderId).select('_id');
        if (orderExists) {
          validOrderId = orderExists._id;
        }
      }
    }

    // Create ticket document
    const newTicket = new SupportTicket({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      relatedOrderId: validOrderId,
      submittedBy,
    });

    await newTicket.save();

    // Fire-and-forget notification emails using existing Nodemailer transport
    sendSupportTicketConfirmationEmail(newTicket).catch((err) => {
      console.error('[SupportController] Failed to dispatch customer confirmation email:', err.message);
    });
    sendSupportTicketAdminNotificationEmail(newTicket).catch((err) => {
      console.error('[SupportController] Failed to dispatch admin notification email:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully.',
      ticketToken: newTicket.ticketToken,
      ticket: {
        ticketToken: newTicket.ticketToken,
        subject: newTicket.subject,
        status: newTicket.status,
        createdAt: newTicket.createdAt,
      },
    });
  } catch (err) {
    console.error('[SupportController] createTicket error:', err);
    return res.status(500).json({ message: 'Failed to create support ticket. Please try again.' });
  }
};

/**
 * 2. Public lookup of ticket by ticketToken
 * GET /api/support/tickets/:token
 */
exports.getTicketByToken = async (req, res) => {
  try {
    const rawToken = req.params.token;
    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({ message: 'Ticket token is required.' });
    }

    const token = rawToken.trim().toUpperCase();

    const ticket = await SupportTicket.findOne({ ticketToken: token })
      .populate('relatedOrderId', 'currentStatus totalAmount pickupDate')
      .lean();

    if (!ticket) {
      return res.status(404).json({
        message: `No support ticket found matching reference code "${token}".`,
      });
    }

    // Public response: strictly minimal fields (no internal user IDs or sensitive auth info)
    return res.status(200).json({
      success: true,
      ticket: {
        ticketToken: ticket.ticketToken,
        subject: ticket.subject,
        message: ticket.message,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        resolvedAt: ticket.resolvedAt,
        resolutionNotes: ticket.resolutionNotes || '',
        relatedOrderId: ticket.relatedOrderId ? ticket.relatedOrderId._id : null,
        relatedOrderDetails: ticket.relatedOrderId
          ? {
              status: ticket.relatedOrderId.currentStatus,
              totalAmount: ticket.relatedOrderId.totalAmount,
              pickupDate: ticket.relatedOrderId.pickupDate,
            }
          : null,
      },
    });
  } catch (err) {
    console.error('[SupportController] getTicketByToken error:', err);
    return res.status(500).json({ message: 'Error retrieving support ticket.' });
  }
};

/**
 * 3. List all support tickets (Admin only)
 * GET /api/support/tickets
 */
exports.listTickets = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { ticketToken: regex },
        { subject: regex },
        { email: regex },
        { name: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [tickets, total, counts] = await Promise.all([
      SupportTicket.find(query)
        .populate('submittedBy', 'name email role')
        .populate('relatedOrderId', 'currentStatus totalAmount pickupDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      SupportTicket.countDocuments(query),
      SupportTicket.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts = {
      All: 0,
      Pending: 0,
      'In Progress': 0,
      Resolved: 0,
      Closed: 0,
    };

    counts.forEach((c) => {
      if (statusCounts[c._id] !== undefined) {
        statusCounts[c._id] = c.count;
      }
      statusCounts.All += c.count;
    });

    return res.status(200).json({
      success: true,
      tickets,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      statusCounts,
    });
  } catch (err) {
    console.error('[SupportController] listTickets error:', err);
    return res.status(500).json({ message: 'Error fetching support tickets.' });
  }
};

/**
 * 4. Update ticket status & resolution notes (Admin only)
 * PATCH /api/support/tickets/:id/status
 */
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    const validStatuses = ['Pending', 'In Progress', 'Resolved', 'Closed'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Lookup either by MongoDB ObjectId or ticketToken
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { ticketToken: id.toUpperCase() };

    const ticket = await SupportTicket.findOne(query);
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found.' });
    }

    ticket.status = status;
    if (typeof resolutionNotes === 'string') {
      ticket.resolutionNotes = resolutionNotes.trim();
    }

    // Set resolvedAt timestamp when transitioning to Resolved or Closed
    if (status === 'Resolved' || status === 'Closed') {
      if (!ticket.resolvedAt) {
        ticket.resolvedAt = new Date();
      }
    } else {
      // Re-opened ticket
      ticket.resolvedAt = null;
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    return res.status(200).json({
      success: true,
      message: `Ticket status updated to "${status}".`,
      ticket,
    });
  } catch (err) {
    console.error('[SupportController] updateTicketStatus error:', err);
    return res.status(500).json({ message: 'Failed to update ticket status.' });
  }
};
