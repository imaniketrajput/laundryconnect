const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require("http"); 
const connectDB = require('./config/db');
const {buildTrieFromDB} = require("./utils/serviceTrie");
const { initSocket } = require("./utils/socket");

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB

connectDB().then(()=> buildTrieFromDB());
const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server) or in allowed list
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback permissive for dev and preview deployments
  },
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/slots", require("./routes/slotRoutes"));
app.use("/api/partners", require("./routes/partnerRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/geocode", require("./routes/geocodeRoutes"));

app.get('/', (req, res) => res.send('LaundryConnect API running'));

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
});


 