/**
 * Nominatim Geocoding Utility for OpenStreetMap
 * Resolves text addresses to { lat, lng } coordinates and reverse-geocodes GPS fixes.
 * Includes rate-limiting compliance, custom User-Agent, and zero hardcoded location fallbacks.
 */

let lastGeocodeTime = 0;
const MIN_INTERVAL_MS = 1050; // Nominatim strictly enforces max 1 request per second

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Geocode a text address to latitude and longitude coordinates.
 * Returns null if the address cannot be resolved (no hardcoded fallback coordinates).
 * 
 * @param {string} address - Freeform street address
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
const geocodeAddress = async (address) => {
  if (!address || typeof address !== "string" || !address.trim()) {
    return null;
  }

  // Rate-limiting throttle (1 request per second)
  const now = Date.now();
  const timeSinceLast = now - lastGeocodeTime;
  if (timeSinceLast < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - timeSinceLast);
  }
  lastGeocodeTime = Date.now();

  try {
    const encodedAddress = encodeURIComponent(address.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;

    const response = await fetch(url, {
      headers: {
        // Nominatim terms of use requires a descriptive User-Agent
        "User-Agent": "LaundryConnect/1.0 (contact@laundryconnect.com)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[Geocoder] Nominatim returned HTTP ${response.status} for query "${address}"`);
      return null;
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon); // Note: Nominatim uses 'lon'

      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }

    console.warn(`[Geocoder] No real coordinates found for "${address}". Returning null (no fallback coordinate).`);
    return null;
  } catch (err) {
    console.error(`[Geocoder] Geocoding error for "${address}":`, err.message);
    return null;
  }
};

const suggestionCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

/**
 * Suggest matching real-world addresses using Nominatim autocomplete search.
 * @param {string} query - Partial address query
 * @param {string} countryCode - Restrict to ISO 3166-1 country code (default: 'in')
 * @returns {Promise<Array<{ displayName: string, lat: number, lng: number }>>}
 */
const suggestAddresses = async (query, countryCode = "in") => {
  if (!query || typeof query !== "string" || query.trim().length < 3) {
    return [];
  }

  const cleanQuery = query.trim().toLowerCase();
  const cacheKey = `${countryCode}:${cleanQuery}`;

  const cached = suggestionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Rate-limiting throttle (1 request per second to protect free Nominatim tier)
  const now = Date.now();
  const timeSinceLast = now - lastGeocodeTime;
  if (timeSinceLast < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - timeSinceLast);
  }
  lastGeocodeTime = Date.now();

  try {
    const encodedQuery = encodeURIComponent(query.trim());
    const countryParam = countryCode ? `&countrycodes=${encodeURIComponent(countryCode)}` : "";
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5${countryParam}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "LaundryConnect/1.0 (contact@laundryconnect.com)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[Geocoder:Suggest] Nominatim returned HTTP ${response.status} for "${query}"`);
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const suggestions = data
      .map((item) => {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (isNaN(lat) || isNaN(lng)) return null;
        return {
          displayName: item.display_name,
          lat,
          lng,
          placeId: item.place_id,
          type: item.type,
        };
      })
      .filter(Boolean);

    // Cache successful suggestions
    suggestionCache.set(cacheKey, {
      data: suggestions,
      timestamp: Date.now(),
    });

    // Prune cache if it grows beyond 200 entries
    if (suggestionCache.size > 200) {
      const oldestKey = suggestionCache.keys().next().value;
      suggestionCache.delete(oldestKey);
    }

    return suggestions;
  } catch (err) {
    console.error(`[Geocoder:Suggest] Suggestion error for "${query}":`, err.message);
    return [];
  }
};

/**
 * Reverse geocode latitude and longitude to a human-readable address.
 * Used for site-wide one-time location permission on first load.
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{ displayName: string, lat: number, lng: number } | null>}
 */
const reverseGeocode = async (lat, lng) => {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (isNaN(numLat) || isNaN(numLng)) {
    return null;
  }

  // Rate-limiting throttle
  const now = Date.now();
  const timeSinceLast = now - lastGeocodeTime;
  if (timeSinceLast < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - timeSinceLast);
  }
  lastGeocodeTime = Date.now();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLng}&zoom=18&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "LaundryConnect/1.0 (contact@laundryconnect.com)",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[Geocoder:Reverse] Nominatim returned HTTP ${response.status} for coords (${numLat}, ${numLng})`);
      return null;
    }

    const data = await response.json();
    if (!data || !data.display_name) {
      return null;
    }

    return {
      displayName: data.display_name,
      lat: numLat,
      lng: numLng,
      address: data.address || {},
    };
  } catch (err) {
    console.error(`[Geocoder:Reverse] Reverse geocoding error for (${numLat}, ${numLng}):`, err.message);
    return null;
  }
};

module.exports = {
  geocodeAddress,
  suggestAddresses,
  reverseGeocode,
};
