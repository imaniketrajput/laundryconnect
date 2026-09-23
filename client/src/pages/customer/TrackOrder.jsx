import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import socket from "../../api/socket";
import api from '../../api/axios';
import StatusTimeline from '../../components/StatusTimeline';
import { TimelineSkeleton } from '../../components/Skeleton';
import { Search, Sparkles, AlertCircle, Calendar, MapPin } from 'lucide-react';

const TrackOrder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveStatus, setLiveStatus] = useState(null);
  const queryId = searchParams.get('id');

  useEffect(() => {
    if (queryId) {
      setOrderId(queryId);
      trackOrder(queryId);
    }
  }, [queryId]);

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleStatusUpdate = (data) => {
      if (data.orderId === orderId || data.orderId === queryId) {
        setLiveStatus(data.status);
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                currentStatus: data.status,
                statusHistory: [
                  ...prev.statusHistory,
                  { status: data.status, timestamp: data.timestamp },
                ],
              }
            : prev
        );
      }
    };

    socket.on("orderStatusUpdate", handleStatusUpdate);

    return () => {
      socket.off("orderStatusUpdate", handleStatusUpdate);
    };
  }, [orderId, queryId]);

  const trackOrder = async (idToTrack) => {
    const id = idToTrack || orderId;
    if (!id.trim()) {
      setError('Please enter a valid Order ID.');
      return;
    }

    setOrder(null);
    setError('');
    setLoading(true);

    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
      setSearchParams({ id });

      socket.connect();
      socket.emit("joinOrderRoom", id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Order not found. Please verify the ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    trackOrder();
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto transition-colors duration-200">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold text-theme-primary font-poppins">
          Track Your <span className="text-theme-accent">Order</span>
        </h1>
        <p className="text-theme-muted text-sm mt-0.5">Enter your order reference ID to see current status progress.</p>
      </div>

      {/* Lookup Bar */}
      <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-theme-sm max-w-xl mx-auto mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow rounded-2xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-theme-muted" />
            </div>
            <input
              type="text"
              required
              placeholder="e.g. 64b8f520c15efc1c9c8bc84f"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-theme-elevated border border-theme rounded-2xl text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center space-x-1.5 py-3 px-6 bg-theme-accent text-[var(--accent-text)] rounded-2xl text-sm font-bold shadow-theme-accent disabled:opacity-50 transition-all duration-200 theme-btn-hover"
          >
            <span>Track Order</span>
          </button>
        </form>
      </div>

      {/* Tracking Results Area */}
      {loading ? (
        <TimelineSkeleton />
      ) : error ? (
        <div className="bg-theme-card border border-red-500/30 p-6 rounded-3xl text-center max-w-md mx-auto text-red-500 space-y-2 shadow-theme-sm">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold">Tracking Lookup Failed</h3>
          <p className="text-xs text-theme-muted">{error}</p>
        </div>
      ) : order ? (
        <div className="bg-theme-card rounded-3xl border border-theme shadow-theme-md p-6 sm:p-8 space-y-8 animate-fade-in">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-theme gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-theme-muted">Tracking Code:</span>
                <span className="font-mono text-xs font-bold text-theme-primary bg-theme-elevated px-2 py-0.5 rounded border border-theme">
                  {order._id}
                </span>
                {order.isExpress && (
                  <span className="flex items-center space-x-1 bg-theme-accent-light text-theme-accent px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border border-theme-accent">
                    <Sparkles className="h-3 w-3" />
                    <span>Priority Express</span>
                  </span>
                )}
                {liveStatus && (
                  <span className="flex items-center space-x-1 bg-green-500/10 text-green-500 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border border-green-500/30 animate-pulse">
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span>
                    <span>Live Update: {liveStatus}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-theme-muted mt-1">
                Placed on: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-theme-muted block font-bold uppercase tracking-widest">Grand Total</span>
              <span className="text-2xl font-black text-theme-primary">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Stepper timeline */}
          <div>
            <h3 className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-6">Status Progression</h3>
            <StatusTimeline currentStatus={order.currentStatus} statusHistory={order.statusHistory} />
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-theme">
            <div>
              <h3 className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-3">Laundry Manifest</h3>
              <ul className="space-y-2 text-sm text-theme-muted">
                {order.services.map((item, idx) => (
                  <li key={idx} className="flex justify-between border-b border-theme/50 pb-1.5">
                    <span>{item.service?.name || 'Laundry Garment'}</span>
                    <span className="font-bold text-theme-primary">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-theme-primary uppercase tracking-wider">Logistics Summary</h3>
              <div className="text-sm space-y-2 text-theme-muted">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-theme-accent mt-0.5 flex-shrink-0" />
                  <p className="leading-relaxed">
                    <strong className="text-theme-primary">Address:</strong> {order.pickupAddress}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-theme-accent flex-shrink-0" />
                  <p>
                    <strong className="text-theme-primary">Pickup Date:</strong> {new Date(order.pickupDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-theme-card border border-theme rounded-3xl p-8 max-w-sm mx-auto text-theme-muted shadow-theme-sm">
          <p className="text-sm">Enter an Order ID above to request live status logs from our Heap Priority Queue database.</p>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
