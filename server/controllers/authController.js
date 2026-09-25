const User = require("../models/User");
const DeliveryPartner = require("../models/DeliveryPartner");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { sendWelcomeEmail } = require("../utils/emailService");

const generateToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

let verifyGoogleIdToken = async (idToken, audience) => {
    const client = new OAuth2Client(audience);
    const ticket = await client.verifyIdToken({
        idToken,
        audience,
    });
    return ticket.getPayload();
};

exports.register = async (req, res) => {
    try {
        const { name, email, password, role, phone, address } = req.body;
        const normalizedEmail = email?.toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });

        if (existing) return res.status(400).json({ message: "Email already registered" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role,
            phone,
            address,
        });

        // Fire-and-forget welcome email notification (non-blocking)
        sendWelcomeEmail(user).catch((err) => {
            console.error("[AuthController] Failed to send welcome email:", err.message);
        });

        res.status(201).json({
            token: generateToken(user),
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user || user.isActive === false) return res.status(400).json({ message: "Invalid credentials" });

        // If user account was created via Google Sign-In only, no local password exists
        if (!user.password) {
            return res.status(400).json({
                message: "This account uses Google Sign-In. Please use the Google button to log in."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        res.json({
            token: generateToken(user),
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/**
 * POST /api/auth/google
 * Verifies Google ID token, links existing accounts by email or creates new user.
 * Accepts optional `role` ("customer" | "partner") for new registrations.
 */
exports.googleAuth = async (req, res) => {
    try {
        const token = req.body.credential || req.body.idToken;
        if (!token) {
            return res.status(400).json({ message: "Google ID token is required." });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return res.status(500).json({ message: "Google Client ID is not configured on the server." });
        }

        let payload;
        try {
            payload = await verifyGoogleIdToken(token, clientId);
        } catch (verifyErr) {
            return res.status(401).json({ message: "Invalid or expired Google token: " + verifyErr.message });
        }

        if (!payload || !payload.email) {
            return res.status(400).json({ message: "Unable to extract email from Google token payload." });
        }

        const googleId = payload.sub;
        const email = payload.email.toLowerCase().trim();
        const name = payload.name || "Google User";
        const picture = payload.picture || null;

        // ACCOUNT LINKING LOGIC:
        // Find existing user by googleId OR by verified email
        let user = await User.findOne({
            $or: [{ googleId }, { email }]
        });

        if (user) {
            if (user.isActive === false) {
                return res.status(403).json({ message: "This account has been deactivated. Please contact support." });
            }

            let modified = false;
            // Link googleId if this account was previously password-only
            if (!user.googleId) {
                user.googleId = googleId;
                modified = true;
            }
            // Pre-fill profile photo from Google if user doesn't already have one
            if (!user.profilePhoto && picture) {
                user.profilePhoto = picture;
                modified = true;
            }
            if (modified) {
                await user.save();
            }

            return res.json({
                token: generateToken(user),
                user: { id: user._id, name: user.name, email: user.email, role: user.role }
            });
        }

        // NEW GOOGLE USER:
        // If role is not yet selected, inform frontend to prompt for role selection
        const { role, vehicleType, phone, address } = req.body;
        if (!role) {
            return res.json({
                newGoogleUser: true,
                email,
                name,
                picture,
            });
        }

        // Validate selected role
        if (!["customer", "partner"].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified. Role must be 'customer' or 'partner'." });
        }

        // Create new User document (password left undefined for Google-only auth)
        user = await User.create({
            name,
            email,
            googleId,
            role,
            phone: phone || "",
            address: address || "",
            profilePhoto: picture,
        });

        // If partner, also create the associated DeliveryPartner document
        if (role === "partner") {
            await DeliveryPartner.create({
                user: user._id,
                vehicleType: vehicleType || "Bike",
                profilePhoto: picture,
            });
        }

        // Fire-and-forget welcome email notification
        sendWelcomeEmail(user).catch((err) => {
            console.error("[AuthController:googleAuth] Failed to send welcome email:", err.message);
        });

        return res.status(201).json({
            token: generateToken(user),
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        console.error("[AuthController:googleAuth] Error:", err);
        return res.status(500).json({ message: err.message });
    }
};

// Export helper for mock testing token verification
exports._setVerifyGoogleIdToken = (fn) => {
    verifyGoogleIdToken = fn;
};