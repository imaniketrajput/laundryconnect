import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusTimeline from '../../components/StatusTimeline';
import StarRating from '../../components/StarRating';
import InvoiceModal from '../../components/InvoiceModal';
import { OrderSkeleton } from '../../components/Skeleton';
import {
  Loader2, ClipboardList, Sparkles, RefreshCw, AlertTriangle,
  X, CreditCard, Banknote, Smartphone, CheckCircle2, AlertCircle,
  Receipt, Send
} from 'lucide-react';

// ─── Shared status badge color map ───────────────────────────────────────────
export const STATUS_COLORS = {
  Placed:          'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  PickedUp:        'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  Washing:         'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800',
  Ready:           'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  OutForDelivery:  'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
  Delivered:       'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800',
  Cancelled:       'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      <div className="relative bg-theme-card text-theme-primary rounded-3xl shadow-2xl w-full max-w-md border border-theme overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-theme-hero p-6 text-theme-primary border-b border-theme relative">
          <button
            onClick={onClose}
            disabled={submitting}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-elevated transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="text-xs text-theme-accent uppercase tracking-widest font-bold mb-1">Secure Checkout</p>
          <h2 className="text-xl font-black font-poppins">Pay for Order</h2>
          <p className="text-xs font-mono text-theme-muted mt-1 truncate">{order._id}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount */}
          <div className="flex items-center justify-between bg-theme-elevated rounded-2xl p-4 border border-theme">
            <span className="text-sm font-bold text-theme-muted">Amount Due</span>
            <span className="text-2xl font-black text-theme-primary">₹{order.totalAmount}</span>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Select Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map(({ id, label, sub, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-150 text-center
                    ${method === id
                      ? 'border-theme-accent bg-theme-accent-light text-theme-accent shadow-sm'
                      : 'border-theme bg-theme-surface hover:border-theme-accent text-theme-muted'
                    }`}
                >
                  <Icon className={`h-5 w-5 mb-1.5 ${method === id ? 'text-theme-accent' : 'text-theme-muted'}`} />
                  <span className={`text-xs font-black ${method === id ? 'text-theme-accent' : 'text-theme-primary'}`}>{label}</span>
                  <span className="text-[9px] text-theme-muted leading-tight mt-0.5">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-500 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-500 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Payment successful! Updating your order…</span>
            </div>
          )}

          {/* Confirm Button */}
          <button
            onClick={handlePay}
            disabled={submitting || success}
            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-theme-accent text-[var(--accent-text)] font-black rounded-2xl shadow-theme-accent transition-all disabled:opacity-60 disabled:cursor-not-allowed theme-btn-hover"
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

  if (done) {
    return (
      <div className="flex items-center space-x-3 bg-theme-accent-light border border-theme-accent rounded-2xl p-4">
        <StarRating value={rating} readOnly size="text-xl" />
        <div>
          <p className="text-xs font-bold text-theme-primary">Your Review</p>
          {comment && <p className="text-xs text-theme-muted mt-0.5 italic">"{comment}"</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-elevated/50 border border-theme rounded-2xl p-5 space-y-4">
      <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider">Rate Your Experience</h4>

      <StarRating value={rating} onChange={setRating} size="text-3xl" />

      <textarea
        rows={2}
        placeholder="Share your experience (optional)…"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full text-xs bg-theme-surface border border-theme rounded-xl p-3 resize-none text-theme-primary placeholder-theme-muted focus:outline-none focus:border-theme-accent transition-colors"
      />

      {error && (
        <p className="text-red-500 text-xs flex items-center space-x-1">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="flex items-center space-x-1.5 px-4 py-2 bg-theme-accent text-[var(--accent-text)] rounded-xl text-xs font-bold transition-all disabled:opacity-60 theme-btn-hover"
      >
        {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
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
  const [payModal, setPayModal] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);

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

  const handlePaymentSuccess = (orderId) => {
    setOrders((prev) =>
      prev.map((o) => o._id === orderId ? { ...o, paymentStatus: 'Paid' } : o)
    );
  };

  const handleReviewSubmitted = (orderId, { rating, comment }) => {
    setOrders((prev) =>
      prev.map((o) => o._id === orderId ? { ...o, rating, reviewComment: comment } : o)
    );
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-theme-primary font-poppins">
            My <span className="text-theme-accent">Orders</span>
          </h1>
          <p className="text-theme-muted text-sm mt-0.5">Manage and track your active laundry pickups and deliveries.</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center space-x-1.5 px-4 py-2 bg-theme-card hover:bg-theme-elevated text-theme-primary rounded-xl text-xs font-bold border border-theme transition-colors shadow-theme-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <OrderSkeleton />
          <OrderSkeleton />
          <OrderSkeleton />
        </div>
      ) : error ? (
        <div className="bg-theme-card border border-theme p-8 rounded-3xl text-center max-w-md mx-auto space-y-4 shadow-theme-sm">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h3 className="text-lg font-bold text-theme-primary">Network Sync Failed</h3>
          <p className="text-sm text-theme-muted">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-5 py-2.5 bg-theme-accent text-[var(--accent-text)] rounded-xl text-xs font-bold transition-all theme-btn-hover"
          >
            Retry Connection
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-theme-card border border-theme p-10 rounded-3xl text-center max-w-md mx-auto space-y-4 shadow-theme-sm">
          <ClipboardList className="h-12 w-12 text-theme-muted mx-auto" />
          <h3 className="text-lg font-bold text-theme-primary">No Orders Found</h3>
          <p className="text-sm text-theme-muted">You haven't scheduled any pickups yet. Let's get your laundry sorted!</p>
          <div className="pt-2">
            <Link
              to="/services"
              className="inline-flex items-center space-x-2 bg-theme-accent text-[var(--accent-text)] px-6 py-3 rounded-2xl text-sm font-bold shadow-md theme-btn-hover"
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
              className="bg-theme-card rounded-3xl border border-theme shadow-theme-sm p-6 space-y-6 hover:shadow-theme-md transition-all theme-card-hover"
            >
              {/* ── Card Header ───────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-theme gap-4">
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-bold text-theme-muted">Order ID:</span>
                    <span className="font-mono text-sm font-bold text-theme-primary bg-theme-elevated px-2.5 py-0.5 rounded-lg border border-theme">
                      {order._id}
                    </span>
                    {order.isExpress && (
                      <span className="flex items-center space-x-1 bg-theme-accent-light text-theme-accent px-2 py-0.5 rounded-lg font-bold uppercase text-[9px] border border-theme-accent">
                        <Sparkles className="h-3 w-3 text-theme-accent" />
                        <span>Express</span>
                      </span>
                    )}
                    {/* Status badge */}
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${STATUS_COLORS[order.currentStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {order.currentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-theme-muted">
                    Placed on: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Right: amount + payment action */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <span className="text-xs text-theme-muted block font-bold uppercase tracking-wider">Total Value</span>
                    <span className="text-2xl font-black text-theme-primary">₹{order.totalAmount}</span>
                  </div>

                  {/* ── Payment buttons ── */}
                  {order.paymentStatus === 'Pending' && (
                    <button
                      onClick={() => setPayModal(order._id)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-theme-accent text-[var(--accent-text)] rounded-xl text-xs font-black shadow-theme-accent transition-all theme-btn-hover"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Pay Now</span>
                    </button>
                  )}
                  {order.paymentStatus === 'Paid' && (
                    <button
                      onClick={() => setInvoiceModal(order._id)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-theme-elevated hover:bg-theme-surface text-theme-primary border border-theme rounded-xl text-xs font-bold transition-all"
                    >
                      <Receipt className="h-3.5 w-3.5 text-theme-accent" />
                      <span>View Invoice</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ── Services + Delivery details ───────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-2">Garments Category</h4>
                  <ul className="space-y-1 text-sm text-theme-muted">
                    {order.services.map((item, idx) => (
                      <li key={idx} className="flex justify-between max-w-sm">
                        <span>{item.service?.name || 'Laundry Item'}</span>
                        <span className="font-bold text-theme-primary">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-2">Delivery Details</h4>
                  <div className="text-sm space-y-1.5 text-theme-muted">
                    <p><strong className="text-theme-primary">Address:</strong> {order.pickupAddress}</p>
                    <p><strong className="text-theme-primary">Pickup Scheduled:</strong> {new Date(order.pickupDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* ── Status Stepper ────────────────────────────────────── */}
              <div className="border-t border-theme pt-6">
                <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider mb-4">Track Status</h4>
                <StatusTimeline currentStatus={order.currentStatus} statusHistory={order.statusHistory} />
              </div>

              {/* ── Review Widget (Delivered orders only) ─────────────── */}
              {order.currentStatus === 'Delivered' && (
                <div className="border-t border-theme pt-6">
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
