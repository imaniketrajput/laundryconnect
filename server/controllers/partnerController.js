const DeliveryPartner = require("../models/DeliveryPartner");
const User = require("../models/User");
const Order = require("../models/Order");

exports.createPartner = async (req, res) =>{
    try{
        const {userId, vehicleType, currentLocation} = req.body;

        const user = await User.findById(userId);
        if(!user) return res.status(404).json({message: "User not found"});
        if(user.role !== "partner"){
            return res.status(400).json({message: "User must have role 'partner' "});
        }

        const existing = await DeliveryPartner.findOne({user: userId});
        if(existing) return res.status(400).json({message: "Partner profile already exists for this user"});

        const partner = await DeliveryPartner.create({
            user: userId,
            vehicleType,
            currentLocation,
        });

        res.status(201).json(partner);

    }catch(err){
        res.status(500).json({message: err.message});
    }
};

exports.getPartners = async (req, res) => {
    try{
        const partners = await DeliveryPartner.find().populate("user", "name email phone");
        res.json(partners);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};

/**
 * GET /api/partners/live-locations
 * Admin-only: Returns snapshot of all active/available delivery partners with their
 * latest persisted coordinates, vehicle type, and current assigned order if any.
 */
exports.getLiveLocations = async (req, res) => {
    try {
        const partners = await DeliveryPartner.find().populate("user", "name email phone");

        // Fetch active orders to correlate assigned partner
        const activeOrders = await Order.find({
            currentStatus: { $in: ["Placed", "PickedUp", "Washing", "Ready", "OutForDelivery"] },
            assignedPartner: { $ne: null }
        }).select("_id currentStatus pickupAddress totalAmount assignedPartner");

        const livePartners = partners.map(partner => {
            const assignedOrder = activeOrders.find(o => 
                o.assignedPartner && (
                    o.assignedPartner.toString() === partner._id.toString() ||
                    (partner.user && o.assignedPartner.toString() === partner.user._id.toString())
                )
            );

            return {
                id: partner._id,
                name: partner.user?.name || "Delivery Partner",
                phone: partner.user?.phone || "",
                email: partner.user?.email || "",
                vehicleType: partner.vehicleType || "Bike",
                isAvailable: partner.isAvailable,
                currentLocation: partner.currentLocation || null,
                currentOrder: assignedOrder ? {
                    id: assignedOrder._id,
                    currentStatus: assignedOrder.currentStatus,
                    pickupAddress: assignedOrder.pickupAddress,
                    totalAmount: assignedOrder.totalAmount
                } : null
            };
        });

        res.json(livePartners);
    } catch (err) {
        console.error("[PartnerController:getLiveLocations] Error:", err.message);
        res.status(500).json({ message: err.message });
    }
};