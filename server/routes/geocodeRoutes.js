const express = require("express");
const router = express.Router();
const { suggestAddresses } = require("../utils/geocoder");

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

module.exports = router;
