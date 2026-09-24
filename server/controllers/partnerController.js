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
        const partners = await DeliveryPartner.find().populate("user", "name email phone profilePhoto");

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

            // Compute 100% completeness status according to Partner checklist
            const isComplete = Boolean(
                partner.user?.name &&
                partner.user?.email &&
                partner.user?.phone &&
                (partner.profilePhoto || partner.user?.profilePhoto) &&
                partner.vehicleType &&
                (partner.baseLocation?.lat && partner.baseLocation?.lng)
            );

            return {
                id: partner._id,
                name: partner.user?.name || "Delivery Partner",
                phone: partner.user?.phone || "",
                email: partner.user?.email || "",
                vehicleType: partner.vehicleType || "Bike",
                isAvailable: partner.isAvailable,
                isProfileComplete: isComplete,
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

/**
 * GET /api/partners/profile
 * Partner-only: Returns partner driver profile with vehicle details and base location.
 */
exports.getPartnerProfile = async (req, res) => {
    try {
        let partner = await DeliveryPartner.findOne({ user: req.user.id }).populate("user", "name email phone profilePhoto");
        if (!partner) {
            // Auto-create partner doc if user has partner role
            partner = await DeliveryPartner.create({
                user: req.user.id,
                vehicleType: "Bike",
            });
            partner = await DeliveryPartner.findById(partner._id).populate("user", "name email phone profilePhoto");
        }

        res.json(partner);
    } catch (err) {
        console.error("[PartnerController:getPartnerProfile] Error:", err.message);
        res.status(500).json({ message: err.message });
    }
};

/**
 * PUT /api/partners/profile
 * Partner-only: Updates vehicle type, base location, profile photo, and driver contact info.
 * Enforces email immutability.
 */
exports.updatePartnerProfile = async (req, res) => {
    try {
        const { name, phone, vehicleType, baseLocation, profilePhoto, email } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Security check: locked email
        if (email && email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
            return res.status(400).json({ message: "Email address cannot be changed." });
        }

        if (name && name.trim()) user.name = name.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (profilePhoto) user.profilePhoto = profilePhoto;
        await user.save();

        let partner = await DeliveryPartner.findOne({ user: req.user.id });
        if (!partner) {
            partner = new DeliveryPartner({ user: req.user.id });
        }

        if (vehicleType) partner.vehicleType = vehicleType;
        if (profilePhoto) partner.profilePhoto = profilePhoto;
        if (baseLocation && typeof baseLocation === "object") {
            partner.baseLocation = {
                address: baseLocation.address || "",
                lat: typeof baseLocation.lat === "number" ? baseLocation.lat : undefined,
                lng: typeof baseLocation.lng === "number" ? baseLocation.lng : undefined,
            };

            // If partner has no live location yet, pre-fill currentLocation with baseLocation
            if (partner.baseLocation.lat && partner.baseLocation.lng && (!partner.currentLocation || !partner.currentLocation.lat)) {
                partner.currentLocation = {
                    lat: partner.baseLocation.lat,
                    lng: partner.baseLocation.lng,
                    accuracy: 10,
                    timestamp: new Date(),
                };
            }
        }

        await partner.save();

        const updated = await DeliveryPartner.findById(partner._id).populate("user", "name email phone profilePhoto");
        res.json({
            message: "Partner profile updated successfully",
            partner: updated,
        });
    } catch (err) {
        console.error("[PartnerController:updatePartnerProfile] Error:", err.message);
        res.status(500).json({ message: err.message });
    }
};