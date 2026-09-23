const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail } = require("../utils/emailService");

const generateToken = (user) =>
    jwt.sign({id: user._id, role: user.role }, process.env.JWT_SECRET, {expiresIn: "7d"});

exports.register = async (req, res) =>{
    try{
        const {name, email, password, role, phone, address} = req.body;
        const existing = await User.findOne({email});

        if(existing) return res.status(400).json({message: "Email already registered"});

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name, email, password: hashedPassword, role, phone, address,
        });

        // Fire-and-forget welcome email notification (non-blocking)
        sendWelcomeEmail(user).catch((err) => {
            console.error("[AuthController] Failed to send welcome email:", err.message);
        });

        res.status(201).json({
            token: generateToken(user),
            user: {id: user._id, name: user.name, email: user.email, role: user.role},    
        });

    }catch(err){
        res.status(500).json({message: err.message}); 
    }
};

exports.login = async (req, res) =>{
    try{
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({message: "Invalid credentials"});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({message: "Invaild credentials"});

        res.json({
            token: generateToken(user),
            user: {id: user._id, name: user.name, email: user.email, role: user.role},
        });
    }catch(err){
        res.status(500).json({message: err.message});
    }
};