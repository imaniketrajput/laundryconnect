import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusTimeline from '../../components/StatusTimeline';
import StarRating from '../../components/StarRating';
import InvoiceModal from '../../components/InvoiceModal';
import {
  Loader2, ClipboardList, Sparkles, RefreshCw, AlertTriangle,
  X, CreditCard, Banknote, Smartphone, CheckCircle2, AlertCircle,
  Receipt, Send
} from 'lucide-react';

// ─── Shared status badge color map ───────────────────────────────────────────
export const STATUS_COLORS = {
  Placed:          'bg-gray-100 text-gray-700 border-gray-200',
  PickedUp:        'bg-blue-100 text-blue-700 border-blue-200',
  Washing:         'bg-purple-100 text-purple-700 border-purple-200',
  Ready:           'bg-amber-100 text-amber-700 border-amber-200',
  OutForDelivery:  'bg-orange-100 text-orange-700 border-orange-200',
  Delivered:       'bg-green-100 text-green-700 border-green-200',
  Cancelled:       'bg-red-100 text-red-700 border-red-200',
};

// ─── PayNow Modal ─────────────────────────────────────────────────────────────
const PayNowModal = ({ order, onClose, onSuccess }) => {
  const [method, setMethod] = useState('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && !submitting) onClose();
  };

  const handlePay = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/payments/${order._id}/pay`, { paymentMethod: method });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const METHODS = [
    { id: 'UPI',  label: 'UPI',  sub: 'Google Pay, PhonePe, Paytm', Icon: Smartphone },
    { id: 'Card', label: 'Card', sub: 'Debit / Credit Card',          Icon: CreditCard },
    { id: 'Cash', label: 'Cash', sub: 'Pay on Pickup',                Icon: Banknote },
  ];

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-4"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-navy-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-950 p-6 text-white">
          <button
            onClick={onClose}
            disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="text-xs text-navy-300 uppercase tracking-widest font-bold mb-1">Secure Checkout</p>
          <h2 className="text-xl font-black font-poppins">Pay for Order</h2>
          <p className="text-xs font-mono text-navy-400 mt-1 truncate">{order._id}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="flex items-center justify-between bg-navy-50 rounded-2xl p-4 border border-navy-100">
            <span className="text-sm font-bold text-navy-700">Amount Due</span>
            <span className="text-2xl font-black text-navy-950">₹{order.totalAmount}</span>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-navy-500 uppercase tracking-wider">Select Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(({ id, label, sub, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-150 text-center
                    ${method === id
                      ? 'border-gold-500 bg-gold-50 shadow-md shadow-gold-500/10'
                      : 'border-navy-100 bg-white hover:border-navy-300'
                    }`}
                >
                  <Icon className={`h-5 w-5 mb-1.5 ${method === id ? 'text-gold-600' : 'text-navy-500'}`} />
                  <span className={`text-xs font-black ${method === id ? 'text-navy-900' : 'text-navy-700'}`}>{label}</span>
                  <span className="text-[9px] text-navy-400 leading-tight mt-0.5">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Payment successful! Updating your order…</span>
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handlePay}
            disabled={submitting || success}
            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-gold-500 hover:bg-gold-600 text-navy-950 font-black rounded-2xl shadow-md shadow-gold-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                <span>Confirm Payment · ₹{order.totalAmount}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Review Widget (inline on order card) ────────────────────────────────────
const ReviewWidget = ({ orderId, existingRating, existingComment, onSubmitted }) => {
  const [rating, setRating] = useState(existingRating || 0);
  const [comment, setComment] = useState(existingComment || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(!!existingRating);

  const handleSubmit = async () => {
    if (!rating) { setError('Please select a star rating.'); return; }
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/orders/${orderId}/review`, { rating, comment });
      setDone(true);
      if (onSubmitted) onSubmitted({ rating, comment });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Read-only if already rated
  if (done) {
    return (
      <div className="flex items-center space-x-3 bg-gold-50 border border-gold-200 rounded-2xl p-4">
        <StarRating value={rating} readOnly size="text-xl" />
        <div>
          <p className="text-xs font-bold text-navy-800">Your Review</p>
          {comment && <p className="text-xs text-navy-500 mt-0.5 italic">"{comment}"</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy-50/60 border border-navy-100 rounded-2xl p-5 space-y-4">
      <h4 className="text-xs font-bold text-navy-700 uppercase tracking-wider">Rate Your Experience</h4>

      <StarRating value={rating} onChange={setRating} size="text-3xl" />

      <textarea
        rows={2}
        placeholder="Share your experience (optional)…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full text-xs bg-white border border-navy-200 rounded-xl p-3 resize-none text-navy-800 placeholder-navy-300 focus:outline-none focus:border-gold-400 transition-colors"
      />

      {error && (
        <p className="text-red-600 text-xs flex items-center space-x-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex items-center space-x-1.5 px-4 py-2 bg-navy-900 hover:bg-navy-850 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 text-gold-400" />}
        <span>Submit Review</span>
      </button>
    </div>
  );
};

// ─── Main MyOrders page ───────────────────────────────────────────────────────
const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active modals — keyed by orderId
  const [payModal, setPayModal] = useState(null);     // orderId | null
  const [invoiceModal, setInvoiceModal] = useState(null); // orderId | null

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/orders/my-orders');
      const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch your orders. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Optimistically update one order's paymentStatus without full refetch
  const handlePaymentSuccess = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => o._id === orderId ? { ...o, paymentStatus: 'Paid' } : o)
    );
  };

  // Update one order's rating without full refetch
  const handleReviewSubmitted = (orderId, { rating, comment }) => {
    setOrders((prev) =>
      prev.map((o) => o._id === orderId ? { ...o, rating, reviewComment: comment } : o)
    );
  };

  return (
    <div className="min-h-screen bg-navy-50 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 font-poppins">
            My <span className="text-gold-600">Orders</span>
          </h1>
          <p className="text-navy-500 text-sm mt-0.5">Manage and track your active laundry pickups and deliveries.</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-navy-50 text-navy-700 rounded-xl text-xs font-bold border border-navy-200 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-navy-500">
          <Loader2 className="h-10 w-10 animate-spin text-gold-500 mb-4" />
          <p className="text-sm font-semibold">Updating order timelines…</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-navy-100 p-8 rounded-3xl text-center max-w-md mx-auto space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-navy-900">Network Sync Failed</h3>
          <p className="text-sm text-navy-500">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-850 transition-all"
          >
            Retry Connection
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-navy-100 p-10 rounded-3xl text-center max-w-md mx-auto space-y-4 shadow-sm">
          <ClipboardList className="h-12 w-12 text-navy-300 mx-auto" />
          <h3 className="text-lg font-bold text-navy-900">No Orders Found</h3>
          <p className="text-sm text-navy-500">You haven't scheduled any pickups yet. Let's get your laundry sorted!</p>
          <div className="pt-2">
            <Link
              to="/services"
              className="inline-flex items-center space-x-2 bg-gold-500 hover:bg-gold-600 text-navy-950 px-6 py-3 rounded-2xl text-sm font-bold shadow-md shadow-gold-500/10"
            >
              <span>Schedule Your First Pickup</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl border border-navy-100 shadow-sm p-6 space-y-6 hover:shadow-md transition-shadow"
            >
              {/* ── Card Header ───────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-navy-50 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-bold text-navy-400">Order ID:</span>
                    <span className="font-mono text-sm font-bold text-navy-900 bg-navy-50 px-2.5 py-0.5 rounded-lg border border-navy-100">
                      {order._id}
                    </span>
                    {order.isExpress && (
                      <span className="flex items-center space-x-1 bg-gold-100 text-gold-700 px-2 py-0.5 rounded-lg font-bold uppercase text-[9px] border border-gold-200">
                        <Sparkles className="h-3 w-3 text-gold-600" />
                        <span>Express</span>
                      </span>
                    )}
                    {/* Status badge */}
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${STATUS_COLORS[order.currentStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {order.currentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-navy-450">
                    Placed on: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Right: amount + payment action */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <span className="text-xs text-navy-450 block font-bold uppercase tracking-wider">Total Value</span>
                    <span className="text-2xl font-black text-navy-950">₹{order.totalAmount}</span>
                  </div>

                  {/* ── Payment buttons ── */}
                  {order.paymentStatus === 'Pending' && (
                    <button
                      onClick={() => setPayModal(order._id)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-navy-950 rounded-xl text-xs font-black shadow-sm shadow-gold-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Pay Now</span>
                    </button>
                  )}
                  {order.paymentStatus === 'Paid' && (
                    <button
                      onClick={() => setInvoiceModal(order._id)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-navy-50 text-navy-700 border border-navy-200 rounded-xl text-xs font-bold transition-all"
                    >
                      <Receipt className="h-3.5 w-3.5 text-gold-600" />
                      <span>View Invoice</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Services + Delivery details ───────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-navy-700 uppercase tracking-wider mb-2">Garments Category</h4>
                  <ul className="space-y-1 text-sm text-navy-600">
                    {order.services.map((item, idx) => (
                      <li key={idx} className="flex justify-between max-w-sm">
                        <span>{item.service?.name || 'Laundry Item'}</span>
                        <span className="font-bold text-navy-900">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-navy-700 uppercase tracking-wider mb-2">Delivery Details</h4>
                  <div className="text-sm space-y-1.5 text-navy-600">
                    <p><strong className="text-navy-900">Address:</strong> {order.pickupAddress}</p>
                    <p><strong className="text-navy-900">Pickup Scheduled:</strong> {new Date(order.pickupDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* ── Status Stepper ────────────────────────────────────── */}
              <div className="border-t border-navy-50 pt-6">
                <h4 className="text-xs font-bold text-navy-750 uppercase tracking-wider mb-4">Track Status</h4>
                <StatusTimeline currentStatus={order.currentStatus} statusHistory={order.statusHistory} />
              </div>

              {/* ── Review Widget (Delivered orders only) ─────────────── */}
              {order.currentStatus === 'Delivered' && (
                <div className="border-t border-navy-50 pt-6">
                  <ReviewWidget
                    orderId={order._id}
                    existingRating={order.rating}
                    existingComment={order.reviewComment}
                    onSubmitted={(data) => handleReviewSubmitted(order._id, data)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {payModal && (
        <PayNowModal
          order={orders.find((o) => o._id === payModal)}
          onClose={() => setPayModal(null)}
          onSuccess={() => handlePaymentSuccess(payModal)}
        />
      )}
      {invoiceModal && (
        <InvoiceModal
          orderId={invoiceModal}
          onClose={() => setInvoiceModal(null)}
        />
      )}
    </div>
  );
};

export default MyOrders;
