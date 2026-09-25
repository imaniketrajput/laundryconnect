const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const DeliveryPartner = require("../models/DeliveryPartner");
const Message = require("../models/Message");
const { haversineDistance } = require("./routeOptimizer");
const { sanitizeChatMessage } = require("./sanitize");

let io;

// In-memory rate limiting map for chat socket events (max 1 msg/sec per socket)
const lastSocketChatTimes = new Map();

const initSocket = (server) => {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: { origin: "*" }, 
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("joinOrderRoom", (orderId) => {
      if (orderId) {
        socket.join(orderId.toString());
      }
    });

    // ─── Live Delivery Partner Location Streaming (with Signal Quality Validation) ─
    socket.on("updateLocation", async ({ orderId, lat, lng, accuracy, token }) => {
      try {
        if (!token || !orderId || typeof lat !== "number" || typeof lng !== "number") {
          console.warn("[Socket:Quality] updateLocation rejected: Missing or invalid parameters");
          return;
        }

        // 1. Verify JWT token
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
          console.warn("[Socket:Quality] updateLocation rejected: Invalid or expired token:", jwtErr.message);
          return;
        }

        // 2. Check partner role
        if (!decoded || decoded.role !== "partner") {
          console.warn(`[Socket:Quality] updateLocation rejected: User ${decoded?.id} is not a partner (role: ${decoded?.role})`);
          return;
        }

        // 3. Signal Quality Check: GPS Accuracy Filter (Ceiling: 100m)
        if (typeof accuracy === "number" && accuracy > 100) {
          console.warn(
            `[Socket:Quality] updateLocation rejected for order ${orderId}: Low GPS accuracy (${accuracy}m > 100m ceiling) for partner ${decoded.id}`
          );
          return;
        }

        // 4. Fetch order
        const order = await Order.findById(orderId);
        if (!order) {
          console.warn(`[Socket:Quality] updateLocation rejected: Order ${orderId} not found`);
          return;
        }

        // 5. Look up DeliveryPartner document for this partner user
        let partnerDoc = await DeliveryPartner.findOne({ user: decoded.id });

        // 6. Verify partner is assigned to this order (compare against decoded.id and partnerDoc._id)
        const isAssigned = order.assignedPartner && (
          order.assignedPartner.toString() === decoded.id ||
          (partnerDoc && order.assignedPartner.toString() === partnerDoc._id.toString())
        );

        if (!isAssigned) {
          console.warn(`[Socket:Quality] updateLocation rejected: Partner ${decoded.id} is NOT the assignedPartner for order ${orderId}`);
          return;
        }

        // 7. Signal Quality Check: Implied Speed Ceiling (Ceiling: 120 km/h)
        if (
          partnerDoc &&
          partnerDoc.currentLocation &&
          typeof partnerDoc.currentLocation.lat === "number" &&
          typeof partnerDoc.currentLocation.lng === "number"
        ) {
          const prevLoc = partnerDoc.currentLocation;
          const prevTime = partnerDoc.currentLocation.timestamp || partnerDoc.updatedAt;

          if (prevTime) {
            const elapsedHours = (Date.now() - new Date(prevTime).getTime()) / (1000 * 60 * 60);

            // Validate against recent updates (within 30 minutes)
            if (elapsedHours > 0 && elapsedHours < 0.5) {
              const distanceKm = haversineDistance(prevLoc, { lat, lng });
              // Ignore jitter under 10 meters
              if (distanceKm > 0.01) {
                const speedKmh = distanceKm / elapsedHours;

                if (speedKmh > 120) {
                  console.warn(
                    `[Socket:Quality] updateLocation rejected for order ${orderId}: Implausible teleport speed (${speedKmh.toFixed(1)} km/h > 120 km/h ceiling) for partner ${decoded.id}`
                  );
                  return;
                }
              }
            }
          }
        }

        // 8. Broadcast validated live location to order room
        const locationData = {
          lat,
          lng,
          accuracy: typeof accuracy === "number" ? accuracy : null,
          timestamp: new Date(),
        };
        getIO().to(orderId.toString()).emit("partnerLocation", locationData);

        // 9. Persist validated location to DeliveryPartner document
        const partnerLocationData = {
          lat,
          lng,
          accuracy: typeof accuracy === "number" ? accuracy : null,
          timestamp: new Date(),
        };

        if (partnerDoc) {
          partnerDoc.currentLocation = partnerLocationData;
          await partnerDoc.save();
        } else {
          await DeliveryPartner.findOneAndUpdate(
            { user: decoded.id },
            { currentLocation: partnerLocationData },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }
      } catch (err) {
        console.error("[Socket] Error in updateLocation handler:", err.message);
      }
    });

    // ─── Live Customer-Partner Order Chat ──────────────────────────────────────
    socket.on("sendChatMessage", async ({ orderId, text, token }) => {
      try {
        if (!token || !orderId || typeof text !== "string" || !text.trim()) {
          console.warn("[Socket:Chat] sendChatMessage rejected: Missing or invalid parameters");
          return;
        }

        // Rate limiting: max 1 message per second per socket connection
        const now = Date.now();
        const lastChatTime = lastSocketChatTimes.get(socket.id) || 0;
        if (now - lastChatTime < 1000) {
          console.warn(`[Socket:Chat] sendChatMessage rejected: Rate limit exceeded for socket ${socket.id}`);
          return;
        }
        lastSocketChatTimes.set(socket.id, now);

        // 1. Verify JWT token
        let decoded;
        try {
          decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
          console.warn("[Socket:Chat] sendChatMessage rejected: Invalid or expired token:", jwtErr.message);
          return;
        }

        // 2. Validate text length (max 1000 chars)
        const trimmedText = text.trim();
        if (trimmedText.length === 0 || trimmedText.length > 1000) {
          console.warn(`[Socket:Chat] sendChatMessage rejected: Invalid length (${trimmedText.length})`);
          return;
        }

        // 3. Sanitize text server-side (strip/escape HTML for basic XSS prevention)
        const sanitizedText = sanitizeChatMessage(trimmedText);

        // 4. Fetch order from main transactional database
        const order = await Order.findById(orderId);
        if (!order) {
          console.warn(`[Socket:Chat] sendChatMessage rejected: Order ${orderId} not found`);
          return;
        }

        // 5. Verify sender is either customer or assigned partner (reject silently/log only)
        const isCustomer = order.customer && order.customer.toString() === decoded.id;
        let isAssignedPartner = false;
        if (order.assignedPartner) {
          if (order.assignedPartner.toString() === decoded.id) {
            isAssignedPartner = true;
          } else {
            const partnerDoc = await DeliveryPartner.findOne({ user: decoded.id });
            if (partnerDoc && order.assignedPartner.toString() === partnerDoc._id.toString()) {
              isAssignedPartner = true;
            }
          }
        }

        if (!isCustomer && !isAssignedPartner) {
          console.warn(`[Socket:Chat] sendChatMessage rejected: User ${decoded.id} is neither customer nor assigned partner for order ${orderId}`);
          return;
        }

        const senderRole = isCustomer ? "customer" : "partner";

        // 6. Check separate Message model availability
        if (!Message) {
          console.warn("[Socket:Chat] sendChatMessage dropped: Chat DB model is not available");
          return;
        }

        // 7. Save message to separate chat database
        const savedMessage = await Message.create({
          order: order._id,
          sender: decoded.id,
          senderRole,
          text: sanitizedText,
          createdAt: new Date(),
        });

        // 8. Broadcast to order room
        getIO().to(orderId.toString()).emit("newChatMessage", {
          _id: savedMessage._id,
          order: order._id,
          sender: decoded.id,
          senderRole,
          text: savedMessage.text,
          createdAt: savedMessage.createdAt,
        });
      } catch (err) {
        console.error("[Socket:Chat] Error in sendChatMessage handler:", err.message);
      }
    });

    socket.on("disconnect", () => {
      lastSocketChatTimes.delete(socket.id);
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initSocket, getIO };