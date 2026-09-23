import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Truck, Zap, Navigation, Loader2,
  RefreshCw, AlertTriangle, CheckCircle2, AlertCircle
} from 'lucide-react';
import { STATUS_COLORS } from '../customer/MyOrders';
import { DashboardTableSkeleton } from '../../components/Skeleton';

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
        startLocation: { lat: 12.9716, lng: 77.5946 },
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
                      return (
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
                                className="text-xs bg-theme-elevated border border-theme rounded-xl px-2.5 py-1.5 text-theme-primary font-semibold focus:outline-none focus:border-theme-accent transition-colors disabled:opacity-60"
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
                        </tr>
                      );
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
                <span className="font-mono font-bold text-theme-primary">12.9716, 77.5946 (Base)</span>
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
