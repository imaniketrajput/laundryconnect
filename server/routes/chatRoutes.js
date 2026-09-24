const express = require('express');
const router = express.Router();
const { handleChatMessage } = require('../controllers/chatController');
const chatRateLimiter = require('../middleware/rateLimiter');

// POST /api/chat - Protected by in-memory IP rate limiter
router.post('/', chatRateLimiter, handleChatMessage);

module.exports = router;
