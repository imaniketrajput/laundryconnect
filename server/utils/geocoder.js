/**
 * Nominatim Geocoding Utility for OpenStreetMap
 * Resolves text addresses to { lat, lng } coordinates.
 * Includes rate-limiting compliance, custom User-Agent, and sensible fallbacks.
 */

const DEFAULT_COORDINATES = {
  lat: 12.9716, // Bangalore hub coordinates
  lng: 77.5946,
};

let lastGeocodeTime = 0;
const MIN_INTERVAL_MS = 1050; // Nominatim strictly enforces max 1 request per second

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Geocode a text address to latitude and longitude coordinates.
 * @param {string} address - Freeform street address
 * @returns {Promise<{ lat: number, lng: number }>}
 */
const geocodeAddress = async (address) => {
  if (!address || typeof address !== "string" || !address.trim()) {
    return { ...DEFAULT_COORDINATES };
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
      return { ...DEFAULT_COORDINATES };
    }

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon); // Note: Nominatim uses 'lon'

      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }

    console.warn(`[Geocoder] No coordinates found for "${address}". Using regional default.`);
    return { ...DEFAULT_COORDINATES };
  } catch (err) {
    console.error(`[Geocoder] Geocoding error for "${address}":`, err.message);
    return { ...DEFAULT_COORDINATES };
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

module.exports = {
  geocodeAddress,
  suggestAddresses,
  DEFAULT_COORDINATES,
};
