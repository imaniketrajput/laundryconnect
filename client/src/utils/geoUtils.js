/**
 * Geolocation & Spherical Geometry Utilities
 * Implements Haversine distance and speed validation heuristics.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates great-circle distance between two { lat, lng } points in kilometers.
 * @param {{ lat: number, lng: number }} loc1
 * @param {{ lat: number, lng: number }} loc2
 * @returns {number} Distance in kilometers
 */
export const haversineDistance = (loc1, loc2) => {
  if (!loc1 || !loc2 || typeof loc1.lat !== 'number' || typeof loc2.lat !== 'number') {
    return 0;
  }

  const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((loc1.lat * Math.PI) / 180) *
      Math.cos((loc2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

/**
 * Calculates the implied speed in km/h between two timestamped coordinates.
 * @param {{ lat: number, lng: number }} loc1
 * @param {number|Date} time1 - Timestamp of first coordinate
 * @param {{ lat: number, lng: number }} loc2
 * @param {number|Date} time2 - Timestamp of second coordinate
 * @returns {{ distanceKm: number, elapsedHours: number, speedKmh: number }}
 */
export const calculateImpliedSpeed = (loc1, time1, loc2, time2) => {
  const t1 = typeof time1 === 'number' ? time1 : new Date(time1).getTime();
  const t2 = typeof time2 === 'number' ? time2 : new Date(time2).getTime();
  const elapsedMs = Math.abs(t2 - t1);
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  const distanceKm = haversineDistance(loc1, loc2);

  // If distance moved is under 10 meters, consider stationary/jitter (0 km/h)
  if (distanceKm < 0.01) {
    return {
      distanceKm,
      elapsedHours,
      speedKmh: 0,
    };
  }

  const speedKmh = elapsedHours > 0 ? distanceKm / elapsedHours : 0;

  return {
    distanceKm,
    elapsedHours,
    speedKmh,
  };
};

/**
 * Delivery vehicle physical speed ceiling (km/h).
 * Movements faster than this indicate teleportation/GPS spoofing.
 */
export const MAX_DELIVERY_SPEED_KMH = 120;

/**
 * GPS Accuracy threshold in meters.
 * Fixes worse than this are considered low-quality cell/WiFi approximations.
 */
export const MAX_GPS_ACCURACY_METERS = 100;
