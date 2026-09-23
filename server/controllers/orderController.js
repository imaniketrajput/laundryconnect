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

        if(!services || services.length === 0)
        {
            return res.status(400).json({message: "At least one service is required"});
        }

        if(!pickupAddress || !pickupAddress.trim()) {
            return res.status(400).json({message: "Pickup address is required"});
        }

        if(!pickupDate) {
            return res.status(400).json({message: "Pickup date is required"});
        }

        // Validate pickup date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const parsedPickupDate = new Date(pickupDate);
        if (isNaN(parsedPickupDate.getTime()) || parsedPickupDate < today) {
            return res.status(400).json({ message: "Pickup date cannot be in the past" });
        }

        // Authoritative server-side pricing computation
        let itemsSubtotal = 0;
        for(const item of services){
            if(!item.quantity || item.quantity <= 0) {
                return res.status(400).json({message: "Item quantity must be at least 1"});
            }
            const service = await Service.findById(item.service);
            if(!service) return res.status(404).json({message: `Service ${item.service} not found`});
            itemsSubtotal += service.pricePerUnit * item.quantity;
        }

        if(itemsSubtotal <= 0) {
            return res.status(400).json({message: "Order items subtotal must be greater than zero"});
        }

        // Delivery fee: ₹49 unless items subtotal > ₹349; Express fee: ₹150 if isExpress
        const deliveryCharge = itemsSubtotal > 349 ? 0 : 49;
        const expressFee = isExpress ? 150 : 0;
        const totalAmount = itemsSubtotal + deliveryCharge + expressFee;

        const priorityScore = isExpress ? 100 : 10;

        const order = await Order.create({
            customer: customerId,
            services,
            pickupAddress: pickupAddress.trim(),
            pickupDate,
            isExpress: !!isExpress,
            priorityScore,
            itemsSubtotal,
            deliveryCharge,
            expressFee,
            totalAmount,
            paymentStatus: "Pending",
            currentStatus: "Draft",
            orderVisibility: "Draft",
            statusHistory: [{status: "Draft", timestamp: new Date()}],
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

        // IDOR Protection: only order owner or privileged role (admin / partner) can view order
        const isOwner = order.customer.toString() === req.user.id;
        const isPrivileged = req.user.role === "admin" || req.user.role === "partner";
        if (!isOwner && !isPrivileged) {
            return res.status(403).json({ message: "Not authorized to access this order" });
        }

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

    // Partner assignment & authorization check
    if (req.user.role === "partner") {
      // If order is already assigned to another partner, block unauthorized mutation
      if (order.assignedPartner && order.assignedPartner.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to update an order assigned to another partner" });
      }
      // If claiming/picking up an unassigned order, assign to this partner
      if (!order.assignedPartner && (status === "PickedUp" || status === "OutForDelivery")) {
        order.assignedPartner = req.user.id;
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update order status" });
    }

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