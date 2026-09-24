import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [detectedLocation, setDetectedLocation] = useState(null); // { lat, lng }
  const [detectedAddress, setDetectedAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    // Restore from session if already resolved earlier in this session
    const cachedAddress = sessionStorage.getItem('lc_detected_address');
    const cachedCoords = sessionStorage.getItem('lc_detected_coords');
    if (cachedAddress && cachedCoords) {
      try {
        setDetectedAddress(cachedAddress);
        setDetectedLocation(JSON.parse(cachedCoords));
      } catch (e) {
        // ignore parse error
      }
    }

    // Check if permission prompt was already triggered this session
    const alreadyPrompted = sessionStorage.getItem('lc_location_permission_requested');
    if (alreadyPrompted) {
      return;
    }

    sessionStorage.setItem('lc_location_permission_requested', 'true');

    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);

    // Single-shot read via getCurrentPosition (not watchPosition)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setDetectedLocation(coords);
        sessionStorage.setItem('lc_detected_coords', JSON.stringify(coords));

        // Reverse-geocode coordinates silently through backend proxy
        try {
          const res = await api.get(`/geocode/reverse?lat=${latitude}&lng=${longitude}`);
          if (res.data && res.data.displayName) {
            setDetectedAddress(res.data.displayName);
            sessionStorage.setItem('lc_detected_address', res.data.displayName);
          }
        } catch (err) {
          // Fail silently — never block or show banner
          console.debug('[LocationContext] Reverse geocode non-critical warning:', err.message);
        }
      },
      (error) => {
        // Fail silently — never block, no nag banner, graceful fallback to manual entry
        setIsLocating(false);
        console.debug('[LocationContext] Geolocation request dismissed or unavailable:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  }, []);

  return (
    <LocationContext.Provider value={{ detectedLocation, detectedAddress, isLocating }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  return ctx || { detectedLocation: null, detectedAddress: '', isLocating: false };
};
