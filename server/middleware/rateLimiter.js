/**
 * In-Memory Sliding-Window Rate Limiter Middleware
 * 
 * Note on Scalability & Instance Lifecycle:
 * This rate limiter maintains state strictly in Node.js process memory.
 * Consequently:
 * 1. It resets all counters whenever the server process restarts.
 * 2. It does not share state across multiple load-balanced instances (e.g. horizontal clustering).
 * This behavior is completely acceptable for Render's free-tier single-instance web service,
 * but should be backed by Redis (e.g., Upstash or Redis Cloud) if scaling horizontally in production.
 */

// Map of IP -> array of millisecond timestamps
const ipRequestHistory = new Map();

// Configuration defaults: 20 requests per 1-minute window
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;

// Periodic cleanup every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  const threshold = now - WINDOW_MS;

  for (const [ip, timestamps] of ipRequestHistory.entries()) {
    // Keep only timestamps within the active window
    const recent = timestamps.filter((t) => t > threshold);
    if (recent.length === 0) {
      ipRequestHistory.delete(ip);
    } else {
      ipRequestHistory.set(ip, recent);
    }
  }
}, CLEANUP_INTERVAL_MS);

// Allow the Node process to exit cleanly if only the cleanup timer is active
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Express middleware to rate limit chat requests per client IP.
 */
const chatRateLimiter = (req, res, next) => {
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (forwarded ? forwarded.split(',')[0].trim() : null) || 
                   req.ip || 
                   req.socket?.remoteAddress || 
                   'unknown-client';

  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let timestamps = ipRequestHistory.get(clientIp) || [];

  // Prune expired timestamps
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= MAX_REQUESTS) {
    const oldestTimestamp = timestamps[0];
    const retryAfterSec = Math.ceil((oldestTimestamp + WINDOW_MS - now) / 1000);

    res.setHeader('Retry-After', Math.max(1, retryAfterSec));
    return res.status(429).json({
      message: 'Too many requests. Please wait a moment before trying again.',
      retryAfter: Math.max(1, retryAfterSec)
    });
  }

  timestamps.push(now);
  ipRequestHistory.set(clientIp, timestamps);

  next();
};

/**
 * Factory to create in-memory sliding-window rate limiters.
 */
const createRateLimiter = ({ windowMs = 60 * 1000, maxRequests = 20, message = 'Too many requests. Please wait a moment before trying again.' }) => {
  const historyMap = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    const threshold = now - windowMs;
    for (const [ip, timestamps] of historyMap.entries()) {
      const recent = timestamps.filter((t) => t > threshold);
      if (recent.length === 0) {
        historyMap.delete(ip);
      } else {
        historyMap.set(ip, recent);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  if (cleanup.unref) {
    cleanup.unref();
  }

  return (req, res, next) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = (forwarded ? forwarded.split(',')[0].trim() : null) || 
                     req.ip || 
                     req.socket?.remoteAddress || 
                     'unknown-client';

    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = historyMap.get(clientIp) || [];
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= maxRequests) {
      const oldestTimestamp = timestamps[0];
      const retryAfterSec = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      res.setHeader('Retry-After', Math.max(1, retryAfterSec));
      return res.status(429).json({
        message,
        retryAfter: Math.max(1, retryAfterSec),
      });
    }

    timestamps.push(now);
    historyMap.set(clientIp, timestamps);

    next();
  };
};

// Rate limiter for support tickets: 5 tickets per 10 minutes per IP
const supportRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many support tickets submitted from this network. Please wait a few minutes before submitting another ticket.',
});

chatRateLimiter.createRateLimiter = createRateLimiter;
chatRateLimiter.supportRateLimiter = supportRateLimiter;

module.exports = chatRateLimiter;
