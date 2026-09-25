/**
 * Sanitizes chat message text before saving to the database.
 * Strips HTML tags and escapes special characters to prevent cross-site scripting (XSS).
 *
 * @param {string} text - Raw input message text
 * @returns {string} - Sanitized text safe for rendering and storage
 */
const sanitizeChatMessage = (text) => {
  if (typeof text !== 'string') return '';
  
  return text
    // Replace HTML special characters with their safe entity equivalents
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

module.exports = { sanitizeChatMessage };
