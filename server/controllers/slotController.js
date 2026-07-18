const Slot = require("../models/Slot");
const {hasConflict, suggestNextFreeSlot} = require("../utils/intervalScheduler");

exports.bookSlot = async (req, res) =>{
    try{
        const {partnerId, date, startTime, endTime} = req.body;
        const existingSlots = await Slot.find({partner: partnerId, date});

        if(hasConflict(existingSlots, startTime, endTime)){
            const duration = 
            (parseInt(endTime.split(":")[0]) * 60 + parseInt(endTime.split(":")[1])) -
            (parseInt(startTime.split(":")[0]) * 60 + parseInt(startTime.split(":")[1]));
            const suggestion = suggestNextFreeSlot(existingSlots, duration);

            return res.status(409).json({
                message: "Slot conflict -- partner already booked in this window",
                suggestedStartTime: suggestion,
            });
        }

        const slot = await Slot.create({partner: partnerId, date, startTime, endTime});
        res.status(201).json(slot);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};

exports.getPartnerSlots = async (req, res) =>{
    try{
        const {partnerId, date} = req.query;
        const slots = await Slot.find({partner: partnerId, date});
        res.json(slots);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};