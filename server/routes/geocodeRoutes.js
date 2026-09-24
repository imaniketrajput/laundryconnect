const express = require("express");
const router = express.Router();
const { suggestAddresses, reverseGeocode } = require("../utils/geocoder");

/**
 * GET /api/geocode/suggest?q=...
 * Returns real-world address autocomplete suggestions via Nominatim proxy
 */
router.get("/suggest", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || typeof q !== "string" || q.trim().length < 3) {
      return res.json([]);
    }

    const suggestions = await suggestAddresses(q.trim());
    res.json(suggestions);
  } catch (err) {
    console.error("[GeocodeRoute] Error handling suggestion:", err.message);
    res.status(500).json({ message: "Failed to fetch address suggestions" });
  }
});

/**
 * GET /api/geocode/reverse?lat=..&lng=..
 * Returns human-readable address for GPS coordinates via Nominatim proxy
 */
router.get("/reverse", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required" });
    }

    const result = await reverseGeocode(lat, lng);
    if (!result) {
      return res.status(404).json({ message: "Address could not be resolved for these coordinates" });
    }

    res.json(result);
  } catch (err) {
    console.error("[GeocodeRoute] Error handling reverse geocode:", err.message);
    res.status(500).json({ message: "Failed to reverse geocode coordinates" });
  }
});

module.exports = router;
