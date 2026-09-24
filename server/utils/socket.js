const jwt = require("jsonwebtoken");
const Order = require("../models/Order");
const DeliveryPartner = require("../models/DeliveryPartner");
const { haversineDistance } = require("./routeOptimizer");

let io;

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

    socket.on("disconnect", () => {
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