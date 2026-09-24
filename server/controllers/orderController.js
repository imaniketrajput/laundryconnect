const Order = require("../models/Order");
const Service = require("../models/Service");
const DeliveryPartner = require("../models/DeliveryPartner");
const { buildOrderQueue } = require("../utils/orderQueueService");
const { optimizeRoute, haversineDistance } = require("../utils/routeOptimizer");
const { getIO } = require("../utils/socket");
const { sendOrderConfirmationEmail, sendStatusUpdateEmail } = require("../utils/emailService");
const { geocodeAddress } = require("../utils/geocoder");

// Facility Hub & Distance-Based Delivery Pricing Parameters (Jalandhar Central Hub)
const HUB_LAT = parseFloat(process.env.HUB_LAT) || 31.3260;
const HUB_LNG = parseFloat(process.env.HUB_LNG) || 75.5762;
const BASE_DELIVERY_CHARGE = 20; // Base charge covering roughly the first ~3km from hub
const BASE_INCLUDED_KM = 3;     // Kilometers included in the base delivery charge
const PER_KM_RATE = 8;          // Rate per additional km beyond base-included distance
const DISTANT_THRESHOLD_KM = 25; // Threshold beyond which informational banner is presented

/**
 * Authoritative distance-tiered delivery fee formula:
 * - Base delivery charge: ₹20 (covers first 3 km)
 * - Additional distance: ₹8 per km (rounded up for fractional km)
 * - Free delivery waiver applied if itemsSubtotal > ₹349
 * 
 * @param {number} distanceKm - Spherical distance in km from facility hub
 * @param {number} itemsSubtotal - Items subtotal in INR
 * @returns {{ distanceKm: number, extraKm: number, rawDeliveryCharge: number, deliveryCharge: number, isFreeDelivery: boolean, isDistant: boolean }}
 */
const calculateDeliveryFee = (distanceKm, itemsSubtotal = 0) => {
    const validDistance = typeof distanceKm === "number" && !isNaN(distanceKm) && distanceKm >= 0 ? distanceKm : 0;
    const roundedDistance = parseFloat(validDistance.toFixed(1));
    const extraKm = Math.max(0, Math.ceil(roundedDistance - BASE_INCLUDED_KM));
    const rawDeliveryCharge = BASE_DELIVERY_CHARGE + (extraKm * PER_KM_RATE);
    const deliveryCharge = itemsSubtotal > 349 ? 0 : rawDeliveryCharge;
    return {
        distanceKm: roundedDistance,
        extraKm,
        rawDeliveryCharge,
        deliveryCharge,
        isFreeDelivery: itemsSubtotal > 349,
        isDistant: roundedDistance > DISTANT_THRESHOLD_KM,
    };
};

exports.calculateDeliveryFee = calculateDeliveryFee;
exports.BASE_DELIVERY_CHARGE = BASE_DELIVERY_CHARGE;
exports.BASE_INCLUDED_KM = BASE_INCLUDED_KM;
exports.PER_KM_RATE = PER_KM_RATE;

exports.createOrder = async (req, res) =>{
    try{
        const {services, pickupAddress, pickupDate, isExpress, pickupLocation: clientLocation} = req.body;
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

        // Resolve coordinates: use client-supplied autocomplete coordinates if present,
        // or fall back to server-side geocoding
        let pickupLocation = null;
        if (
            clientLocation &&
            typeof clientLocation.lat === "number" &&
            typeof clientLocation.lng === "number" &&
            !isNaN(clientLocation.lat) &&
            !isNaN(clientLocation.lng)
        ) {
            pickupLocation = { lat: clientLocation.lat, lng: clientLocation.lng };
        } else {
            try {
                pickupLocation = await geocodeAddress(pickupAddress.trim());
            } catch (geoErr) {
                console.warn("[OrderController] Initial geocoding warning:", geoErr.message);
            }
        }

        // Distance-Based Dynamic Delivery Fee:
        // Require valid geocoded pickup coordinates (no silent fallback coordinates)
        if (
            !pickupLocation ||
            typeof pickupLocation.lat !== "number" ||
            typeof pickupLocation.lng !== "number" ||
            isNaN(pickupLocation.lat) ||
            isNaN(pickupLocation.lng)
        ) {
            return res.status(400).json({
                message: "Pickup address could not be verified. Please select an address from the suggestions or check your street details."
            });
        }

        const rawDist = haversineDistance({ lat: HUB_LAT, lng: HUB_LNG }, pickupLocation);
        const feeCalc = calculateDeliveryFee(rawDist, itemsSubtotal);
        const deliveryDistanceKm = feeCalc.distanceKm;
        const deliveryCharge = feeCalc.deliveryCharge;

        const expressFee = isExpress ? 150 : 0;
        const totalAmount = itemsSubtotal + deliveryCharge + expressFee;
        const priorityScore = isExpress ? 100 : 10;

        const order = await Order.create({
            customer: customerId,
            services,
            pickupAddress: pickupAddress.trim(),
            pickupLocation: pickupLocation,
            deliveryDistanceKm,
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

/**
 * Lightweight delivery fee preview endpoint for frontend checkout preview.
 * GET /api/orders/estimate-delivery?lat=..&lng=..&itemsSubtotal=..
 */
exports.estimateDeliveryFee = async (req, res) => {
    try {
        let lat = parseFloat(req.query.lat);
        let lng = parseFloat(req.query.lng);
        const itemsSubtotal = parseFloat(req.query.itemsSubtotal) || 0;

        if (isNaN(lat) || isNaN(lng)) {
            if (req.query.address && req.query.address.trim()) {
                try {
                    const coords = await geocodeAddress(req.query.address.trim());
                    if (coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
                        lat = coords.lat;
                        lng = coords.lng;
                    }
                } catch (e) {
                    console.warn("[OrderController] Failed to geocode address for estimate:", e.message);
                }
            }
        }

        // If coordinates cannot be verified, return unverified state without computing distance
        if (isNaN(lat) || isNaN(lng)) {
            return res.json({
                unverified: true,
                message: "Please select an address from suggestions to calculate delivery charge",
                deliveryCharge: null,
                distanceKm: null,
                baseDeliveryCharge: BASE_DELIVERY_CHARGE,
                baseIncludedKm: BASE_INCLUDED_KM,
                perKmRate: PER_KM_RATE,
                hub: { lat: HUB_LAT, lng: HUB_LNG },
            });
        }

        const rawDist = haversineDistance({ lat: HUB_LAT, lng: HUB_LNG }, { lat, lng });
        const feeData = calculateDeliveryFee(rawDist, itemsSubtotal);

        res.json({
            ...feeData,
            unverified: false,
            baseDeliveryCharge: BASE_DELIVERY_CHARGE,
            baseIncludedKm: BASE_INCLUDED_KM,
            perKmRate: PER_KM_RATE,
            distantThresholdKm: DISTANT_THRESHOLD_KM,
            hub: { lat: HUB_LAT, lng: HUB_LNG },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
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

        // Cache pickup coordinates and delivery distance on Order document if missing
        let shouldSave = false;
        if (!order.pickupLocation || typeof order.pickupLocation.lat !== "number") {
            try {
                const coords = await geocodeAddress(order.pickupAddress);
                order.pickupLocation = coords;
                shouldSave = true;
            } catch (geoErr) {
                console.warn("[OrderController] Failed to auto-geocode order address:", geoErr.message);
            }
        }

        if ((!order.deliveryDistanceKm || order.deliveryDistanceKm === 0) && order.pickupLocation && typeof order.pickupLocation.lat === "number") {
            const rawDist = haversineDistance({ lat: HUB_LAT, lng: HUB_LNG }, order.pickupLocation);
            order.deliveryDistanceKm = parseFloat(rawDist.toFixed(1));
            shouldSave = true;
        }

        if (shouldSave) {
            await order.save();
        }

        const orderObj = order.toObject();

        // Attach latest delivery partner location if assigned
        if (order.assignedPartner) {
            try {
                const partnerDoc = await DeliveryPartner.findOne({
                    $or: [
                        { user: order.assignedPartner },
                        { _id: order.assignedPartner }
                    ]
                }).select("currentLocation vehicleType");

                if (partnerDoc && partnerDoc.currentLocation && typeof partnerDoc.currentLocation.lat === "number") {
                    orderObj.partnerLocation = partnerDoc.currentLocation;
                    orderObj.partnerVehicleType = partnerDoc.vehicleType;
                }
            } catch (partnerErr) {
                console.warn("[OrderController] Failed to fetch partner location for order:", partnerErr.message);
            }
        }

        res.json(orderObj);
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