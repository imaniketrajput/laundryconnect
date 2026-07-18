const Service = require("../models/Service");
const {serviceTrie} = require("../utils/serviceTrie");


exports.createService = async (req, res) =>{
    try{
        const {name, category, pricePerUnit, unit, description} = req.body;
        const service = await Service.create({name, category, pricePerUnit, unit, description});
        serviceTrie.insert(service.name, service._id);
        res.status(201).json(service);
    }catch(err)
    {
        res.status(500).json({message: err.message});
    }
};

exports.getServices = async (req, res) =>{
    try{
        const services = await Service.find();
        res.json(services);
    }catch(err){
        res.status(500).json({message: err.message});
    }
};

exports.searchServices = async (req,res) =>{
    try{
        const {q} = req.query;
        if(!q) return res.status(400).json({message: "Query param 'q' is required"});

        const matchedIds = serviceTrie.search(q);

        const services = await Service.find({_id: {$in: matchedIds}});
        res.json(services);
    }catch(err){
        res.status(500).json({message: err.message});
    }
}

