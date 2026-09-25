import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Truck, Home, Navigation2, Radio, Layers, Clock, AlertCircle } from 'lucide-react';

// ─── Bearing Calculation (Spherical Trigonometry) ────────────────────────────
const computeBearing = (prev, next) => {
  if (!prev || !next) return 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const lat1 = toRad(prev.lat);
  const lat2 = toRad(next.lat);
  const dLng = toRad(next.lng - prev.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

// ─── Custom Leaflet DivIcons using SVGs (Zero asset 404s) ────────────────────
const createPickupIcon = () => {
  return L.divIcon({
    className: 'custom-pickup-marker',
    html: `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(245, 158, 11, 0.25); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 34px; height: 34px; background: #f59e0b; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.6);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
};

const createPartnerIcon = (vehicleType = 'Bike', heading = 0) => {
  return L.divIcon({
    className: 'custom-partner-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: rgba(16, 185, 129, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: relative; width: 38px; height: 38px; background: #10b981; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.65); transform: rotate(${heading}deg); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 19 21 12 17 5 21 12 2" fill="rgba(255, 255, 255, 0.35)"></polygon>
          </svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
};

const createStopIcon = (stopNumber) => {
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: relative; width: 30px; height: 30px; background: #6366f1; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.5); color: #ffffff; font-weight: 800; font-size: 11px; font-family: monospace;">
          ${stopNumber}
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

// ─── Camera Controller: Dynamic bounds on initial mount & stops changes ──────
const MapBoundsController = ({ pickupLoc, partnerLoc, additionalStops = [] }) => {
  const map = useMap();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    const points = [];
    if (pickupLoc && typeof pickupLoc.lat === 'number' && typeof pickupLoc.lng === 'number') {
      points.push([pickupLoc.lat, pickupLoc.lng]);
    }
    if (partnerLoc && typeof partnerLoc.lat === 'number' && typeof partnerLoc.lng === 'number') {
      points.push([partnerLoc.lat, partnerLoc.lng]);
    }
    if (Array.isArray(additionalStops)) {
      additionalStops.forEach((stop) => {
        if (stop && typeof stop.lat === 'number' && typeof stop.lng === 'number') {
          points.push([stop.lat, stop.lng]);
        }
      });
    }

    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      if (!hasInitializedRef.current) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        hasInitializedRef.current = true;
      }
    } else if (points.length === 1 && !hasInitializedRef.current) {
      map.setView(points[0], 14);
      hasInitializedRef.current = true;
    }
  }, [map, pickupLoc?.lat, pickupLoc?.lng, additionalStops.length]);

  return null;
};

// ─── Main OrderLiveMap Component ─────────────────────────────────────────────
const OrderLiveMap = ({
  order,
  pickupLocation: propPickupLocation,
  partnerLocation: propPartnerLocation,
  pickupAddress: propPickupAddress,
  currentStatus: propCurrentStatus,
  partnerVehicleType: propPartnerVehicleType = 'Delivery Vehicle',
  lastUpdated: propLastUpdated,
  isPartnerView = false,
  additionalStops = [],
  height = '400px',
}) => {
  // Unify props from direct or object passing
  const pickupLocation = propPickupLocation || order?.pickupLocation;
  const pickupAddress = propPickupAddress || order?.pickupAddress;
  const currentStatus = propCurrentStatus || order?.currentStatus;
  const partnerVehicleType = propPartnerVehicleType || order?.partnerVehicleType || 'Delivery Vehicle';

  // Validate coordinates
  const validPickup = pickupLocation && typeof pickupLocation.lat === 'number' && typeof pickupLocation.lng === 'number';

  // Track last known location & timestamp to freeze in place if connection drops
  const lastKnownPartnerLocRef = useRef(null);
  const lastKnownTimestampRef = useRef(null);

  const incomingPartnerLoc = propPartnerLocation || order?.partnerLocation || null;

  if (incomingPartnerLoc && typeof incomingPartnerLoc.lat === 'number' && typeof incomingPartnerLoc.lng === 'number') {
    lastKnownPartnerLocRef.current = incomingPartnerLoc;
    if (incomingPartnerLoc.timestamp) {
      lastKnownTimestampRef.current = incomingPartnerLoc.timestamp;
    } else if (propLastUpdated) {
      lastKnownTimestampRef.current = propLastUpdated;
    }
  }

  // Freeze in place rather than blanking out when connection drops
  const effectivePartnerLoc = incomingPartnerLoc || lastKnownPartnerLocRef.current;
  const validPartner = effectivePartnerLoc && typeof effectivePartnerLoc.lat === 'number' && typeof effectivePartnerLoc.lng === 'number';

  const effectiveTimestamp =
    incomingPartnerLoc?.timestamp ||
    propLastUpdated ||
    lastKnownTimestampRef.current ||
    null;

  // Position interpolation & rotating marker state
  const [animatedPos, setAnimatedPos] = useState(effectivePartnerLoc);
  const [heading, setHeading] = useState(0);
  const prevTargetRef = useRef(effectivePartnerLoc);
  const animFrameRef = useRef(null);

  // Freshness & disconnect state
  const [freshness, setFreshness] = useState({ isLive: true, secondsAgo: 0, text: 'Live' });

  // Update animated position and bearing when effectivePartnerLoc updates
  useEffect(() => {
    if (!effectivePartnerLoc || typeof effectivePartnerLoc.lat !== 'number' || typeof effectivePartnerLoc.lng !== 'number') {
      return;
    }

    const prevTarget = prevTargetRef.current;
    prevTargetRef.current = effectivePartnerLoc;

    if (!prevTarget || (prevTarget.lat === effectivePartnerLoc.lat && prevTarget.lng === effectivePartnerLoc.lng)) {
      setAnimatedPos(effectivePartnerLoc);
      return;
    }

    // Compute bearing if moved > 0.00003 (~3 meters) to avoid erratic spinning while stationary
    const dLat = effectivePartnerLoc.lat - prevTarget.lat;
    const dLng = effectivePartnerLoc.lng - prevTarget.lng;
    const distSq = dLat * dLat + dLng * dLng;

    if (distSq > 0.00000009) {
      const brng = computeBearing(prevTarget, effectivePartnerLoc);
      setHeading(Math.round(brng));
    }

    // Cancel prior animation frame
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const startPos = animatedPos || prevTarget;
    const targetPos = effectivePartnerLoc;
    const startTime = performance.now();
    const duration = 1200; // 1.2s smooth interpolation

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quad ease-in-out curve
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentLat = startPos.lat + (targetPos.lat - startPos.lat) * ease;
      const currentLng = startPos.lng + (targetPos.lng - startPos.lng) * ease;

      setAnimatedPos({ lat: currentLat, lng: currentLng });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [effectivePartnerLoc?.lat, effectivePartnerLoc?.lng]);

  // Freshness timer (ticks every 1s)
  useEffect(() => {
    const checkFreshness = () => {
      if (!effectiveTimestamp) {
        setFreshness({ isLive: true, secondsAgo: 0, text: 'Live' });
        return;
      }

      const diffMs = Date.now() - new Date(effectiveTimestamp).getTime();
      const seconds = Math.max(0, Math.floor(diffMs / 1000));
      const isLive = seconds < 30;

      let text = 'Live';
      if (seconds < 4) {
        text = 'Updated just now';
      } else if (seconds < 60) {
        text = `Updated ${seconds}s ago`;
      } else {
        const mins = Math.floor(seconds / 60);
        text = `Last seen ${mins}m ago`;
      }

      setFreshness({ isLive, secondsAgo: seconds, text });
    };

    checkFreshness();
    const interval = setInterval(checkFreshness, 1000);
    return () => clearInterval(interval);
  }, [effectiveTimestamp]);

  // In partner view, driver position always renders when available.
  // In customer view, partner position renders strictly during active delivery states.
  const isActiveDelivery = ['PickedUp', 'Washing', 'Ready', 'OutForDelivery'].includes(currentStatus);
  const showPartnerMarker = isPartnerView ? validPartner : (isActiveDelivery && validPartner);

  // Default fallback center: Jalandhar facility hub coordinates
  const defaultCenter = [31.3260, 75.5762];
  const initialCenter = validPickup
    ? [pickupLocation.lat, pickupLocation.lng]
    : validPartner
    ? [effectivePartnerLoc.lat, effectivePartnerLoc.lng]
    : defaultCenter;

  const pickupIcon = useMemo(() => createPickupIcon(), []);
  const partnerIcon = useMemo(() => createPartnerIcon(partnerVehicleType, heading), [partnerVehicleType, heading]);

  const displayedPartnerPos = animatedPos && typeof animatedPos.lat === 'number' && typeof animatedPos.lng === 'number'
    ? [animatedPos.lat, animatedPos.lng]
    : validPartner
    ? [effectivePartnerLoc.lat, effectivePartnerLoc.lng]
    : null;

  const polylinePositions = useMemo(() => {
    if (showPartnerMarker && displayedPartnerPos && validPickup) {
      return [
        displayedPartnerPos,
        [pickupLocation.lat, pickupLocation.lng],
      ];
    }
    return [];
  }, [showPartnerMarker, displayedPartnerPos, validPickup, pickupLocation?.lat, pickupLocation?.lng]);

  return (
    <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-md overflow-hidden transition-colors duration-200">
      {/* Map Header / Status Bar */}
      <div className="p-4 sm:p-5 border-b border-theme flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-theme-elevated/40">
        <div>
          <h3 className="text-sm font-bold text-theme-primary font-poppins flex items-center space-x-2">
            <Navigation2 className="h-4 w-4 text-theme-accent" />
            <span>
              {isPartnerView ? (
                <>Driver Route Guidance &amp; <span className="text-theme-accent">Live Telemetry</span></>
              ) : (
                <>Live Delivery Partner <span className="text-theme-accent">Map Tracking</span></>
              )}
            </span>
          </h3>
          <p className="text-xs text-theme-muted mt-0.5">
            {isPartnerView ? (
              validPartner
                ? 'Real-time GPS telemetry active. Directional route polyline updating live.'
                : 'Awaiting active GPS location fix from browser.'
            ) : showPartnerMarker ? (
              freshness.isLive
                ? 'Real-time partner GPS position active. Map updates live via WebSockets.'
                : 'Partner location unavailable. Last known position displayed.'
            ) : (
              'Pickup address mapped via OpenStreetMap.'
            )}
          </p>
        </div>

        {/* Live Freshness Indicator & Disconnect Handling */}
        <div className="flex items-center gap-2">
          {isPartnerView ? (
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-[11px] font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Driver Navigation Active</span>
            </span>
          ) : showPartnerMarker ? (
            freshness.isLive ? (
              <span className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-xl text-green-500 text-[11px] font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span>Live</span>
                <span className="text-theme-muted font-normal text-[10px] border-l border-green-500/30 pl-2">
                  {freshness.text}
                </span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 text-[11px] font-bold">
                <Clock className="h-3 w-3 animate-pulse" />
                <span>Partner location unavailable</span>
                <span className="text-theme-muted font-normal text-[10px] border-l border-amber-500/30 pl-2">
                  {freshness.text}
                </span>
              </span>
            )
          ) : isActiveDelivery ? (
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 text-[11px] font-bold">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Awaiting Partner GPS</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-theme-elevated border border-theme rounded-xl text-theme-muted text-[11px] font-semibold">
              {currentStatus === 'Delivered' ? 'Delivery Completed' : 'Order Placed'}
            </span>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full" style={{ height }}>
        <MapContainer
          center={initialCenter}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full z-10"
        >
          {/* OpenStreetMap standard free tile source */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapBoundsController
            pickupLoc={validPickup ? pickupLocation : null}
            partnerLoc={showPartnerMarker ? effectivePartnerLoc : null}
            additionalStops={additionalStops}
          />

          {/* Path Polyline between animated partner position and customer destination */}
          {polylinePositions.length === 2 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: '#f59e0b',
                weight: 3.5,
                dashArray: '8, 8',
                opacity: 0.85,
              }}
            />
          )}

          {/* Marker 1: Pickup Destination Address */}
          {validPickup && (
            <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="flex items-center space-x-1 text-amber-500 font-bold uppercase tracking-wider text-[10px]">
                    <Home className="h-3 w-3" />
                    <span>{isPartnerView ? 'Target Delivery Stop' : 'Pickup & Delivery Location'}</span>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {pickupAddress || 'Customer Doorstep'}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    GPS: {pickupLocation.lat.toFixed(4)}, {pickupLocation.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marker 2: Live Smooth-Animated Delivery Partner Vehicle */}
          {showPartnerMarker && displayedPartnerPos && (
            <Marker position={displayedPartnerPos} icon={partnerIcon}>
              <Popup>
                <div className="p-1 space-y-1 text-xs">
                  <div className="flex items-center space-x-1 text-emerald-500 font-bold uppercase tracking-wider text-[10px]">
                    <Truck className="h-3 w-3" />
                    <span>{isPartnerView ? 'My Current Position' : `Delivery Partner (${partnerVehicleType})`}</span>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {isPartnerView ? 'Active GPS Tracking Fix' : 'En Route • Live Telemetry'}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    GPS: {displayedPartnerPos[0].toFixed(4)}, {displayedPartnerPos[1].toFixed(4)}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Heading: {heading}&deg; • {freshness.text}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Additional Selected Route Optimizer Stops */}
          {additionalStops && additionalStops.map((stop, idx) => {
            if (!stop || typeof stop.lat !== 'number' || typeof stop.lng !== 'number') return null;
            return (
              <Marker
                key={stop.orderId || stop.id || idx}
                position={[stop.lat, stop.lng]}
                icon={createStopIcon(stop.stopIndex || idx + 1)}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-xs">
                    <div className="flex items-center space-x-1 text-indigo-500 font-bold uppercase tracking-wider text-[10px]">
                      <span>Route Stop #{stop.stopIndex || idx + 1}</span>
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      {stop.address || `Order #${stop.orderRef || ''}`}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      GPS: {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-theme-card/90 backdrop-blur-md border border-theme p-2 sm:p-2.5 rounded-2xl shadow-theme-sm text-[10px] sm:text-[11px] flex flex-wrap items-center gap-2 sm:gap-3 max-w-[calc(100%-24px)]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-white"></span>
            <span className="text-theme-primary font-semibold">{isPartnerView ? 'Target Order' : 'Pickup Address'}</span>
          </div>
          {showPartnerMarker && (
            <div className="flex items-center space-x-1.5 border-l border-theme pl-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block border border-white"></span>
              <span className="text-theme-primary font-semibold">{isPartnerView ? 'My Position' : 'Delivery Partner'}</span>
            </div>
          )}
          {additionalStops && additionalStops.length > 0 && (
            <div className="flex items-center space-x-1.5 border-l border-theme pl-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block border border-white"></span>
              <span className="text-theme-primary font-semibold">Route Stops ({additionalStops.length})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderLiveMap;
