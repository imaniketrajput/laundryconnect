const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTicketByToken,
  listTickets,
  updateTicketStatus,
} = require('../controllers/supportController');
const { protect, authorize } = require('../middleware/auth');
const { supportRateLimiter } = require('../middleware/rateLimiter');

// POST /api/support/tickets - Public ticket submission with IP rate limiting
router.post('/tickets', supportRateLimiter, createTicket);

// GET /api/support/tickets/:token - Public lookup of ticket status by human-readable token
router.get('/tickets/:token', getTicketByToken);

// GET /api/support/tickets - Admin list all tickets with status filter and pagination
router.get('/tickets', protect, authorize('admin'), listTickets);

// PATCH /api/support/tickets/:id/status - Admin update ticket status and resolution notes
router.patch('/tickets/:id/status', protect, authorize('admin'), updateTicketStatus);

module.exports = router;
