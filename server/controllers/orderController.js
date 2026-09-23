const Order = require("../models/Order");
const Service = require("../models/Service");
const {buildOrderQueue} = require("../utils/orderQueueService");
const {optimizeRoute} = require("../utils/routeOptimizer");
const { getIO } = require("../utils/socket");
const { sendOrderConfirmationEmail, sendStatusUpdateEmail } = require("../utils/emailService");


exports.createOrder = async (req, res) =>{
    try{
        const {services, pickupAddress, pickupDate, isExpress} = req.body;
        const customerId = req.user.id;

        if(!services || services.length == 0)
        {
            return res.status(400).json({message: "At least one service is requires"});
        }

        let totalAmount = 0;
        for(const item of services){
            const service = await Service.findById(item.service);
            if(!service) return res.status(404).json({message: `Service ${item.service} not found`});
            totalAmount += service.pricePerUnit * item.quantity;
        }

        const priorityScore = isExpress ? 100 : 10;

        const order = await Order.create({
            customer: customerId,
            services,
            pickupAddress,
            pickupDate,
            isExpress: isExpress || false,
            priorityScore,
            totalAmount,
            currentStatus: "Placed",
            statusHistory: [{status: "Placed", timestamp: new Date()}],
        });

        // Fire-and-forget order confirmation email notification
        sendOrderConfirmationEmail(order, req.user).catch((err) => {
            console.error("[OrderController] Failed to send order confirmation email:", err.message);
        });

        res.status(201).json(order);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};


exports.getMyOrders = async(req, res) =>{
    try{
        const orders = await Order.find({customer: req.user.id}).populate("services.service");
        res.json(orders);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};

exports.getOrderById = async (req, res) => {
    try{
        const order = await Order.findById(req.params.id).populate("services.service");
        if(!order) return res.status(404).json({message: "Order not found"});
        res.json(order);
    }catch (err){
        res.status(500).json({message: err.message});
    }
};

exports.getOrderQueue = async (req, res) =>{
    try{
        const pq = await buildOrderQueue();
        const sortedOrders = pq.peekAllSorted().map((item)=>({
            order: item.order,
            priority: item.priority,
        }));
        res.json(sortedOrders);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};

exports.getNextOrder = async(req, res) =>{
    try{
        const pq = await buildOrderQueue();
        if(pq.isEmpty()){
            return res.status(200).json({message: "No pending orders"});
        }
        const next = pq.extractMax();
        res.json({order: next.order, priority: next.priority});
    }catch(err){
        res.status(500).json({message: err.message});
    }
};


exports.getOptimizedRoute = async (req, res) =>{
    try{
        const {startLocation, stops } = req.body;

        if(!stops || stops.length===0){
            return res.status(400).json({message: "No stops provide"});
        }

        const route = optimizeRoute(startLocation, stops);
        res.json({optimizedRoute: route});

    }catch(err){
        res.status(500).json({message: err.message});
    }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Placed", "PickedUp", "Washing", "Ready", "OutForDelivery", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.currentStatus = status;
    order.statusHistory.push({ status, timestamp: new Date() });
    await order.save();

    
    getIO().to(order._id.toString()).emit("orderStatusUpdate", {
      orderId: order._id,
      status,
      timestamp: new Date(),
    });

    // Fire-and-forget status update notification (OutForDelivery & Delivered only)
    if (status === "OutForDelivery" || status === "Delivered") {
      sendStatusUpdateEmail(order, null, status).catch((err) => {
        console.error("[OrderController] Failed to send status update email:", err.message);
      });
    }

    res.json({ message: "Status updated", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};