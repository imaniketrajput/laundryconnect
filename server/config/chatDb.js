const mongoose = require('mongoose');
require('dotenv').config();

const chatMongoUri = process.env.CHAT_MONGO_URI;

let chatConnection = null;

if (chatMongoUri && chatMongoUri.trim() && !chatMongoUri.includes('<YOUR_')) {
  try {
    chatConnection = mongoose.createConnection(chatMongoUri);

    chatConnection.on('connected', () => {
      console.log('[ChatDB] MongoDB (Separate Chat Cluster/DB) connected successfully');
    });

    chatConnection.on('error', (err) => {
      console.error('[ChatDB] Separate Chat DB connection error:', err.message);
    });

    chatConnection.on('disconnected', () => {
      console.warn('[ChatDB] Separate Chat DB disconnected');
    });
  } catch (err) {
    console.error('[ChatDB] Failed to initialize separate Chat DB connection:', err.message);
    chatConnection = null;
  }
} else {
  console.warn('[ChatDB] CHAT_MONGO_URI is unset or placeholder. Separate chat features will degrade gracefully.');
}

module.exports = chatConnection;
