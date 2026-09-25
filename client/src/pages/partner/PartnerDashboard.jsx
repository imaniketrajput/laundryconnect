import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../api/axios';
import socket from '../../api/socket';
import OrderLiveMap from '../../components/OrderLiveMap';
import OrderChatPanel from '../../components/OrderChatPanel';
import {
  Truck, Zap, Navigation, Loader2,
  RefreshCw, AlertTriangle, CheckCircle2, AlertCircle,
  Radio, MapPin, Compass, ShieldAlert
} from 'lucide-react';
import { STATUS_COLORS } from '../customer/MyOrders';
import { DashboardTableSkeleton } from '../../components/Skeleton';
import {
  calculateImpliedSpeed,
  MAX_DELIVERY_SPEED_KMH,
  MAX_GPS_ACCURACY_METERS
} from '../../utils/geoUtils';

const MOCK_COORDS = [
  { lat: 12.9740, lng: 77.5920 },
  { lat: 12.9710, lng: 77.5960 },
  { lat: 12.9780, lng: 77.5910 },
  { lat: 12.9690, lng: 77.5990 },
  { lat: 12.9750, lng: 77.5980 }
];

// Ordered list of valid transitions a partner can trigger
const PARTNER_STATUSES = ['Placed', 'PickedUp', 'Washing', 'Ready', 'OutForDelivery', 'Delivered', 'Cancelled'];

const PartnerDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextOrder, setNextOrder] = useState(null);
  const [selectedStops, setSelectedStops] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  // Live Location Sharing & Signal Quality state
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState('');
  const [currentGpsCoords, setCurrentGpsCoords] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [gpsWarning, setGpsWarning] = useState('');
  const watchIdRef = useRef(null);
  const lastEmitTimeRef = useRef(0);
  const activeOrderRef = useRef('');
  const lastAcceptedPositionRef = useRef(null);

  // Keep activeOrderRef in sync with state
  useEffect(() => {
    activeOrderRef.current = activeTrackingOrderId;
  }, [activeTrackingOrderId]);

  // Clean up geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Per-row status update state: { orderId: { updating, msg, type } }
  const [rowStatus, setRowStatus] = useState({});

  const fetchQueue = async () => {
    setLoading(true);
    setError('');
    setNextOrder(null);
    setOptimizedRoute(null);
    try {
      const response = await api.get('/orders/queue');
      setQueue(response.data);
      if (response.data && response.data.length > 0) {
        setActiveTrackingOrderId((prev) => {
          if (prev) return prev;
          const activeItem = response.data.find((item) =>
            ['PickedUp', 'OutForDelivery', 'Ready', 'Washing'].includes(item.order.currentStatus)
          ) || response.data[0];
          return activeItem ? activeItem.order._id : '';
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch orders from priority heap. Make sure server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleGetNext = async () => {
    setError('');
    try {
      const res = await api.get('/orders/queue/next');
      if (res.data.order) {
        setNextOrder(res.data);
      } else {
        alert('No pending orders in the heap queue!');
      }
    } catch {
      setError('Could not extract next order from heap.');
    }
  };

  const handleToggleStop = (orderId) => {
    setSelectedStops((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleOptimizeRoute = async () => {
    if (selectedStops.length === 0) { alert('Please select at least one stop to optimize.'); return; }
    setOptimizing(true);
    try {
      const stops = selectedStops.map((id, index) => {
        const coord = MOCK_COORDS[index % MOCK_COORDS.length];
        return { id, lat: coord.lat, lng: coord.lng };
      });
      const res = await api.post('/orders/optimize-route', {
        startLocation: { lat: 31.3260, lng: 75.5762 },
        stops
      });
      setOptimizedRoute(res.data.optimizedRoute);
    } catch (err) {
      console.error(err);
      alert('Failed to optimize route. Make sure Dijkstra service is active.');
    } finally {
      setOptimizing(false);
    }
  };

  // ─── Active Order and Additional Route Optimizer Stops Memoization ─────────
  const activeOrder = useMemo(() => {
    const item = queue.find((q) => q.order?._id === activeTrackingOrderId);
    return item ? item.order : null;
  }, [queue, activeTrackingOrderId]);

  // Ensure active order has valid coordinates for mapping (with fallback for test/legacy orders)
  const safeActiveOrder = useMemo(() => {
    if (!activeOrder) return null;
    const hasCoord =
      activeOrder.pickupLocation &&
      typeof activeOrder.pickupLocation.lat === 'number' &&
      typeof activeOrder.pickupLocation.lng === 'number';

    if (hasCoord) return activeOrder;

    return {
      ...activeOrder,
      pickupLocation: {
        lat: 12.9740,
        lng: 77.5920,
        address: activeOrder.pickupAddress || 'Customer Address',
      },
    };
  }, [activeOrder]);

  // Map route optimizer stops so they can be rendered as numbered markers alongside live GPS
  const routeOptimizerStops = useMemo(() => {
    if (optimizedRoute && optimizedRoute.length > 0) {
      return optimizedRoute
        .filter((stop) => stop.stopId !== activeTrackingOrderId)
        .map((stop, index) => {
          const item = queue.find((q) => q.order?._id === stop.stopId);
          return {
            id: stop.stopId,
            lat: stop.lat,
            lng: stop.lng,
            stopNumber: index + 1,
            label: `Stop #${index + 1}: Order #${stop.stopId.slice(-6).toUpperCase()}`,
            address: item?.order?.pickupAddress || '',
          };
        });
    }

    return selectedStops
      .filter((orderId) => orderId !== activeTrackingOrderId)
      .map((orderId, index) => {
        const item = queue.find((q) => q.order?._id === orderId);
        const order = item?.order;
        const lat =
          order?.pickupLocation?.lat || MOCK_COORDS[index % MOCK_COORDS.length].lat;
        const lng =
          order?.pickupLocation?.lng || MOCK_COORDS[index % MOCK_COORDS.length].lng;
        return {
          id: orderId,
          lat,
          lng,
          stopNumber: index + 1,
          label: `Stop #${index + 1}: Order #${orderId.slice(-6).toUpperCase()}`,
          address: order?.pickupAddress || '',
        };
      });
  }, [optimizedRoute, selectedStops, activeTrackingOrderId, queue]);

  // ─── Live Delivery GPS Sharing Toggle & Broadcast with Quality Checks ─────
  const toggleLocationSharing = () => {
    if (isSharingLocation) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsSharingLocation(false);
      setGpsError('');
      setGpsWarning('');
      lastAcceptedPositionRef.current = null;
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    const targetOrderId = activeOrderRef.current || (queue[0] && queue[0].order?._id);
    if (!targetOrderId) {
      setGpsError('Please select an active order to stream location for.');
      return;
    }

    if (!activeTrackingOrderId) {
      setActiveTrackingOrderId(targetOrderId);
    }

    setGpsError('');
    setGpsWarning('');
    setIsSharingLocation(true);

    socket.connect();
    lastEmitTimeRef.current = 0; // Force immediate initial broadcast for valid fix
    lastAcceptedPositionRef.current = null;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);
        const now = Date.now();

        // ── Check 1: Accuracy Filter (Must be <= 100 meters) ──
        if (accuracy > MAX_GPS_ACCURACY_METERS) {
          console.warn(
            `[GPS Signal Quality] Accuracy too low (${accuracy}m > ${MAX_GPS_ACCURACY_METERS}m). Update suppressed.`
          );
          setGpsWarning('Weak GPS signal — move to an open area');
          return;
        }

        // ── Check 2: Implied Speed / Jump Filter (Ceiling: 120 km/h) ──
        if (lastAcceptedPositionRef.current) {
          const { speedKmh } = calculateImpliedSpeed(
            lastAcceptedPositionRef.current,
            lastAcceptedPositionRef.current.timestamp,
            { lat, lng },
            now
          );

          if (speedKmh > MAX_DELIVERY_SPEED_KMH) {
            console.warn(
              `[GPS Signal Quality] Implausible speed detected (${speedKmh.toFixed(1)} km/h > ${MAX_DELIVERY_SPEED_KMH} km/h). Update suppressed.`
            );
            setGpsWarning(`Implausible GPS jump detected (> ${MAX_DELIVERY_SPEED_KMH} km/h) — update rejected.`);
            return;
          }
        }

        // Valid GPS fix accepted
        setGpsWarning('');
        lastAcceptedPositionRef.current = { lat, lng, timestamp: now };

        // Feed local live marker directly in real-time (zero socket round-trip latency)
        setCurrentGpsCoords({ lat, lng, accuracy, timestamp: new Date() });

        // Throttle emits to backend socket roughly every 5 seconds
        if (now - lastEmitTimeRef.current >= 5000) {
          lastEmitTimeRef.current = now;
          const currentOrderId = activeOrderRef.current || targetOrderId;
          const token = localStorage.getItem('token');

          if (currentOrderId && token) {
            socket.emit('updateLocation', {
              orderId: currentOrderId,
              lat,
              lng,
              accuracy,
              token,
            });
            console.log(
              `[PartnerDashboard] Broadcast live GPS for order ${currentOrderId}: (${lat.toFixed(5)}, ${lng.toFixed(5)}, ±${accuracy}m)`
            );
          }
        }
      },
      (geoErr) => {
        let msg = 'Unable to retrieve your location.';
        if (geoErr.code === 1) {
          msg = 'Location permission denied. Please allow location access in your browser.';
        } else if (geoErr.code === 2) {
          msg = 'Location unavailable. Ensure GPS/location services are enabled.';
        } else if (geoErr.code === 3) {
          msg = 'Location request timed out. Retrying GPS lock...';
        }
        setGpsError(msg);
        setGpsWarning('');
        lastAcceptedPositionRef.current = null;
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        setIsSharingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    watchIdRef.current = watchId;
  };

  // ─── Status update for one row ────────────────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    setRowStatus((prev) => ({ ...prev, [orderId]: { updating: true, msg: '', type: '' } }));
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      // Update the queue row in-place
      setQueue((prev) =>
        prev.map((item) =>
          item.order._id === orderId
            ? { ...item, order: { ...item.order, currentStatus: newStatus } }
            : item
        )
      );
      setRowStatus((prev) => ({
        ...prev,
        [orderId]: { updating: false, msg: `Status → ${newStatus}`, type: 'success' }
      }));
      // Clear success message after 3s
      setTimeout(() => {
        setRowStatus((prev) => ({ ...prev, [orderId]: { updating: false, msg: '', type: '' } }));
      }, 3000);
    } catch (err) {
      setRowStatus((prev) => ({
        ...prev,
        [orderId]: {
          updating: false,
          msg: err.response?.data?.message || 'Update failed.',
          type: 'error'
        }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 transition-colors duration-200">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-theme-primary font-poppins flex items-center space-x-2">
            <Truck className="h-8 w-8 text-theme-accent" />
            <span>Partner <span className="text-theme-accent">Dashboard</span></span>
          </h1>
          <p className="text-theme-muted text-sm mt-0.5">Heap Priority Queue &amp; Dijkstra Route Optimization Controls.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGetNext}
            className="flex items-center space-x-1.5 px-5 py-3 bg-theme-accent text-[var(--accent-text)] rounded-2xl text-sm font-bold shadow-theme-accent transition-all theme-btn-hover"
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>Process Next Order</span>
          </button>
          <button
            onClick={fetchQueue}
            className="p-3 bg-theme-card hover:bg-theme-elevated text-theme-primary rounded-2xl border border-theme shadow-theme-sm transition-colors"
            title="Refresh Heap"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-500 text-sm max-w-2xl">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Live Delivery GPS Sharing Panel ─────────────────────────── */}
      <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-theme-md transition-colors duration-200">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className={`p-2.5 rounded-2xl border transition-colors ${isSharingLocation ? 'bg-green-500/15 border-green-500/30 text-green-500' : 'bg-theme-elevated border-theme text-theme-muted'}`}>
                <Radio className={`h-5 w-5 ${isSharingLocation ? 'animate-pulse' : ''}`} />
              </span>
              <div>
                <h2 className="text-base font-bold text-theme-primary font-poppins flex items-center gap-2">
                  <span>Live Delivery GPS Tracking</span>
                  {isSharingLocation && (
                    <span className="bg-green-500/15 text-green-500 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-green-500/30 animate-pulse">
                      Live Stream Active
                    </span>
                  )}
                </h2>
                <p className="text-xs text-theme-muted mt-0.5">
                  Stream your vehicle GPS position to the customer's live tracking map via WebSockets.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Order Selector */}
            <div className="w-full sm:w-auto flex-grow sm:flex-grow-0 sm:min-w-[220px]">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1">
                Active Order Target
              </label>
              <select
                value={activeTrackingOrderId}
                onChange={(e) => setActiveTrackingOrderId(e.target.value)}
                disabled={queue.length === 0}
                className="w-full text-base sm:text-xs bg-theme-elevated border border-theme rounded-xl px-3 py-2 text-theme-primary font-semibold focus:outline-none focus:border-theme-accent"
              >
                {queue.length === 0 ? (
                  <option value="">No orders in queue</option>
                ) : (
                  queue.map(({ order }) => (
                    <option key={order._id} value={order._id}>
                      Order #{order._id.slice(-6).toUpperCase()} ({order.currentStatus})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Toggle Button */}
            <div className="self-stretch sm:self-end">
              <button
                type="button"
                onClick={toggleLocationSharing}
                disabled={queue.length === 0 && !activeTrackingOrderId}
                className={`flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-theme-sm disabled:opacity-50 ${
                  isSharingLocation
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30'
                    : 'bg-theme-accent text-[var(--accent-text)] hover:opacity-95 shadow-theme-accent'
                }`}
              >
                {isSharingLocation ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    <span>Stop Location Sharing</span>
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4" />
                    <span>Share My Location</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Bar */}
        {isSharingLocation && currentGpsCoords && (
          <div className="mt-4 pt-4 border-t border-theme flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center space-x-1.5 bg-theme-elevated px-3 py-1.5 rounded-xl border border-theme">
              <MapPin className="h-3.5 w-3.5 text-theme-accent" />
              <span className="text-theme-muted">Coords:</span>
              <span className="font-bold text-theme-primary">
                {currentGpsCoords.lat.toFixed(5)}, {currentGpsCoords.lng.toFixed(5)}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 bg-theme-elevated px-3 py-1.5 rounded-xl border border-theme">
              <Compass className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-theme-muted">Accuracy:</span>
              <span className="font-bold text-theme-primary">&plusmn;{currentGpsCoords.accuracy}m</span>
            </div>
            <div className="text-[11px] text-theme-muted font-sans ml-auto">
              Throttled GPS broadcast every ~7 seconds
            </div>
          </div>
        )}

        {/* Error Alert */}
        {gpsError && (
          <div className="mt-4 flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-amber-500 text-xs">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* GPS Signal Quality Warning Banner */}
        {gpsWarning && (
          <div className="mt-4 flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-amber-500 text-xs animate-pulse">
            <ShieldAlert className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold">{gpsWarning}</span>
          </div>
        )}

        {/* Browser Security Note */}
        <p className="text-[11px] text-theme-muted mt-3">
          &bull; Note: Browser geolocation strictly requires a secure context (HTTPS) or <code className="text-theme-accent font-mono">localhost</code>.
        </p>
      </div>

      {/* ── Live Route & Navigation Map Section ────────────────────────────── */}
      <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-sm overflow-hidden p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-theme-primary font-poppins flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-theme-accent" />
              <span>Live Route & Navigation Map</span>
            </h2>
            <p className="text-xs text-theme-muted mt-0.5">
              Real-time telemetry showing your live vehicle position, customer destination, and active route stops.
            </p>
          </div>
          {isSharingLocation && safeActiveOrder && (
            <div className="flex items-center space-x-2 bg-theme-elevated px-3 py-1.5 rounded-xl border border-theme text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-theme-muted">Routing Target:</span>
              <span className="font-bold text-theme-primary">Order #{safeActiveOrder._id.slice(-6).toUpperCase()}</span>
            </div>
          )}
        </div>

        {isSharingLocation && safeActiveOrder ? (
          <div className="space-y-3">
            <OrderLiveMap
              order={safeActiveOrder}
              partnerLocation={currentGpsCoords}
              isPartnerView={true}
              additionalStops={routeOptimizerStops}
              height="420px"
            />
            <div className="flex flex-wrap items-center justify-between text-[11px] text-theme-muted px-1 gap-2">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Customer Destination</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-theme-accent inline-block" />
                  <span>Your Live GPS Position</span>
                </span>
                {routeOptimizerStops.length > 0 && (
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                    <span>Route Optimizer Stops ({routeOptimizerStops.length})</span>
                  </span>
                )}
              </div>
              <span>Live local telemetry &bull; Zero socket latency on partner map</span>
            </div>
          </div>
        ) : (
          <div className="bg-theme-elevated/40 border border-dashed border-theme rounded-2xl p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-theme-surface border border-theme flex items-center justify-center mx-auto text-theme-muted">
              <Navigation className="h-7 w-7 text-theme-muted opacity-60" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-primary">Live Navigation Map Inactive</h3>
              <p className="text-xs text-theme-muted max-w-md mx-auto mt-1">
                {queue.length === 0
                  ? 'No active orders in the queue to navigate.'
                  : 'Click "Share My Location" above to activate high-accuracy GPS tracking and visualize your live route to the customer.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Extracted Next Order */}
      {nextOrder && (
        <div className="bg-theme-hero text-theme-primary rounded-3xl border border-theme-accent p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="bg-theme-accent text-[var(--accent-text)] px-2.5 py-0.5 rounded font-extrabold text-[9px] uppercase tracking-wider">Priority Target</span>
              <h3 className="text-lg font-bold font-poppins">Extracted from Heap</h3>
            </div>
            <span className="text-xs text-theme-accent font-mono font-bold">Priority Score: {nextOrder.priority}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-theme-surface/50 p-4 rounded-2xl border border-theme">
            <div>
              <p className="text-theme-muted text-xs">Order Reference:</p>
              <p className="font-mono font-semibold pt-0.5 text-theme-primary">{nextOrder.order._id}</p>
              <p className="text-theme-muted text-xs mt-3">Pickup Address:</p>
              <p className="font-semibold pt-0.5 text-theme-primary">{nextOrder.order.pickupAddress}</p>
            </div>
            <div>
              <p className="text-theme-muted text-xs">Total Amount:</p>
              <p className="text-lg font-black text-theme-accent">₹{nextOrder.order.totalAmount}</p>
              <p className="text-theme-muted text-xs mt-2.5">Schedule Time:</p>
              <p className="font-semibold pt-0.5 text-theme-primary">{new Date(nextOrder.order.pickupDate).toLocaleDateString()}</p>
            </div>
          </div>
          {nextOrder.order.assignedPartner && (
            <OrderChatPanel orderId={nextOrder.order._id} defaultCollapsed={true} />
          )}
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <DashboardTableSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Heap Queue Table */}
          <div className="lg:col-span-2 bg-theme-card p-6 rounded-3xl border border-theme shadow-theme-sm space-y-4">
            <h2 className="text-lg font-bold text-theme-primary font-poppins border-b border-theme pb-3">Heap Priority Queue</h2>

            {queue.length === 0 ? (
              <div className="text-center py-20 text-theme-muted">
                <p className="text-sm">No pending orders in the queue.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm divide-y divide-theme">
                  <thead>
                    <tr className="text-theme-muted text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3.5 pl-2">Select</th>
                      <th className="pb-3.5">Order ID</th>
                      <th className="pb-3.5">Address</th>
                      <th className="pb-3.5 text-center">Score</th>
                      <th className="pb-3.5 text-right">Amount</th>
                      <th className="pb-3.5 pl-4">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme font-sans">
                    {queue.map(({ order, priority }) => {
                      const rs = rowStatus[order._id] || {};
                      return [
                        <tr key={order._id} className="hover:bg-theme-elevated/40 transition-colors">
                          <td className="py-3.5 pl-2">
                            <input
                              type="checkbox"
                              checked={selectedStops.includes(order._id)}
                              onChange={() => handleToggleStop(order._id)}
                              className="w-4 h-4 rounded text-theme-accent focus:ring-theme-accent"
                            />
                          </td>
                          <td className="py-3.5 font-mono text-xs font-bold text-theme-primary">
                            {order._id.substring(order._id.length - 8)}
                          </td>
                          <td className="py-3.5 text-xs text-theme-muted max-w-[160px] truncate" title={order.pickupAddress}>
                            {order.pickupAddress}
                          </td>
                          <td className="py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              order.isExpress ? 'bg-theme-accent-light text-theme-accent border border-theme-accent' : 'bg-theme-elevated text-theme-muted border border-theme'
                            }`}>
                              {priority}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-bold text-theme-primary pr-2">
                            ₹{order.totalAmount}
                          </td>

                          {/* ── Status Control ── */}
                          <td className="py-3.5 pl-4">
                            <div className="flex flex-col gap-1.5 min-w-[160px]">
                              {/* Current badge */}
                              <span className={`self-start text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_COLORS[order.currentStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {order.currentStatus}
                              </span>
                              {/* Dropdown */}
                              <select
                                disabled={rs.updating}
                                value={order.currentStatus}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                className="text-base sm:text-xs bg-theme-elevated border border-theme rounded-xl px-2.5 py-2 sm:py-1.5 text-theme-primary font-semibold focus:outline-none focus:border-theme-accent transition-colors disabled:opacity-60 h-10 sm:h-auto"
                              >
                                {PARTNER_STATUSES.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              {/* Feedback */}
                              {rs.updating && <Loader2 className="h-3.5 w-3.5 animate-spin text-theme-accent" />}
                              {!rs.updating && rs.msg && (
                                <span className={`text-[10px] font-bold flex items-center gap-1 ${rs.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                  {rs.type === 'success'
                                    ? <CheckCircle2 className="h-3 w-3" />
                                    : <AlertCircle className="h-3 w-3" />
                                  }
                                  {rs.msg}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>,
                        order.assignedPartner ? (
                          <tr key={`${order._id}-chat`} className="bg-theme-elevated/20">
                            <td colSpan={6} className="p-3 border-b border-theme">
                              <OrderChatPanel orderId={order._id} defaultCollapsed={true} />
                            </td>
                          </tr>
                        ) : null
                      ];
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Route Optimizer */}
          <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-theme-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-theme-primary font-poppins flex items-center space-x-1.5">
                <Navigation className="h-5 w-5 text-theme-accent" />
                <span>Route Optimizer</span>
              </h2>
              <p className="text-xs text-theme-muted leading-relaxed">
                Select orders from the heap queue to generate a Dijkstra-optimized delivery path from the hub.
              </p>
            </div>

            <div className="border border-theme bg-theme-elevated/40 p-4 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-theme-muted font-bold">Start Location:</span>
                <span className="font-mono font-bold text-theme-primary">31.3260, 75.5762 (Jalandhar Hub)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted font-bold">Stops Selected:</span>
                <span className="font-bold text-theme-primary">{selectedStops.length} order(s)</span>
              </div>
            </div>

            <button
              onClick={handleOptimizeRoute}
              disabled={optimizing || selectedStops.length === 0}
              className="w-full flex items-center justify-center space-x-1.5 py-3 px-4 bg-theme-accent text-[var(--accent-text)] rounded-2xl text-sm font-bold shadow-theme-accent disabled:opacity-50 transition-colors theme-btn-hover"
            >
              {optimizing ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-text)]" />
              ) : (
                <>
                  <Navigation className="h-4 w-4" />
                  <span>Optimize Stops</span>
                </>
              )}
            </button>

            {optimizedRoute && (
              <div className="border-t border-theme pt-4 space-y-3 text-left">
                <h3 className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-2">Optimized Path Stops</h3>
                <div className="space-y-3 relative pl-4 border-l border-theme-accent">
                  {optimizedRoute.map((stop, i) => (
                    <div key={stop.stopId} className="relative text-xs">
                      <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 bg-theme-accent rounded-full ring-4 ring-theme-accent-light" />
                      <div className="font-semibold text-theme-primary">
                        Stop {i + 1}: Order #{stop.stopId.substring(stop.stopId.length - 8)}
                      </div>
                      <div className="text-[10px] text-theme-muted mt-0.5">
                        Distance from prev: {stop.distanceFromPrevious.toFixed(2)} km
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;
