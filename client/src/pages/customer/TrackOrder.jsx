import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import socket from "../../api/socket";
import api from '../../api/axios';
import StatusTimeline from '../../components/StatusTimeline';
import { Search, Loader2, Sparkles, AlertCircle, ArrowLeft, Calendar, MapPin } from 'lucide-react';

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
    <div className="min-h-screen bg-navy-50 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold text-navy-900 font-poppins">Track Your <span className="text-gold-600">Order</span></h1>
        <p className="text-navy-500 text-sm mt-0.5">Enter your order reference ID to see current status progress.</p>
      </div>

      {/* Lookup Bar */}
      <div className="bg-white p-6 rounded-3xl border border-navy-100 shadow-sm max-w-xl mx-auto mb-8">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow rounded-2xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-navy-450" />
            </div>
            <input
              type="text"
              required
              placeholder="e.g. 64b8f520c15efc1c9c8bc84f"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-navy-50/50 border border-navy-200 rounded-2xl text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent text-sm font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center space-x-1.5 py-3 px-6 bg-navy-900 hover:bg-navy-850 text-white rounded-2xl text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all duration-200"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-gold-500" /> : <span>Track Order</span>}
          </button>
        </form>
      </div>

      {/* Tracking Results Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-navy-500">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500 mb-3" />
          <p className="text-sm font-semibold">Retrieving tracking records...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-red-100 p-6 rounded-3xl text-center max-w-md mx-auto text-red-800 space-y-2">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h3 className="text-base font-bold">Tracking Lookup Failed</h3>
          <p className="text-xs text-red-700">{error}</p>
        </div>
      ) : order ? (
        <div className="bg-white rounded-3xl border border-navy-100 shadow-md p-6 sm:p-8 space-y-8 animate-fade-in">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-navy-50 gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-navy-400">Tracking Code:</span>
                <span className="font-mono text-xs font-bold text-navy-950 bg-navy-50 px-2 py-0.5 rounded border border-navy-150">
                  {order._id}
                </span>
                {order.isExpress && (
                  <span className="flex items-center space-x-1 bg-gold-50 text-gold-700 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border border-gold-200">
                    <Sparkles className="h-3 w-3 text-gold-500" />
                    <span>Priority Express</span>
                  </span>
                )}
                {liveStatus && (
                  <span className="flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border border-green-200 animate-pulse">
                    <span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span>
                    <span>Live Update: {liveStatus}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-navy-450 mt-1">
                Placed on: {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-navy-450 block font-bold uppercase tracking-widest">Grand Total</span>
              <span className="text-2xl font-black text-navy-950">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Stepper timeline */}
          <div>
            <h3 className="text-xs font-bold text-navy-700 uppercase tracking-wider mb-6">Status Progression</h3>
            <StatusTimeline currentStatus={order.currentStatus} statusHistory={order.statusHistory} />
          </div>

          {/* Order Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-navy-50">
            <div>
              <h3 className="text-xs font-bold text-navy-700 uppercase tracking-wider mb-3">Laundry Manifest</h3>
              <ul className="space-y-2 text-sm text-navy-600">
                {order.services.map((item, idx) => (
                  <li key={idx} className="flex justify-between border-b border-navy-50/50 pb-1.5">
                    <span>{item.service?.name || 'Laundry Garment'}</span>
                    <span className="font-bold text-navy-950">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-navy-700 uppercase tracking-wider">Logistics Summary</h3>
              <div className="text-sm space-y-2 text-navy-650 text-navy-600">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-navy-400 mt-0.5 flex-shrink-0" />
                  <p className="leading-relaxed">
                    <strong className="text-navy-900">Address:</strong> {order.pickupAddress}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-navy-400 flex-shrink-0" />
                  <p>
                    <strong className="text-navy-900">Pickup Date:</strong> {new Date(order.pickupDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-navy-100 rounded-3xl p-8 max-w-sm mx-auto text-navy-500">
          <p className="text-sm">Enter an Order ID above to request live status logs from our Heap Priority Queue database.</p>
        </div>
      )}
    </div>
  );
};

export default TrackOrder;
