const DeliveryPartner = require("../models/DeliveryPartner");
const User = require("../models/User");

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