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
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));


app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/slots", require("./routes/slotRoutes"));
app.use("/api/partners", require("./routes/partnerRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

app.get('/', (req, res) => res.send('LaundryConnect API running'));

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>{
    console.log(`Server running on port ${PORT}`);
});


 