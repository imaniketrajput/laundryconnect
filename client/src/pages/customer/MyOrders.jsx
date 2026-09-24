import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusTimeline from '../../components/StatusTimeline';
import StarRating from '../../components/StarRating';
import InvoiceModal from '../../components/InvoiceModal';
import { OrderSkeleton } from '../../components/Skeleton';
import {
  Loader2, ClipboardList, Sparkles, RefreshCw, AlertTriangle,
  X, CreditCard, Banknote, Smartphone, CheckCircle2, AlertCircle,
  Receipt, Send, ShieldCheck, Lock
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

// ─── PayNow Modal (Razorpay Live Integration) ─────────────────────────────────
const PayNowModal = ({ order, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current && !submitting && !verifying) onClose();
  };

  const handlePay = async () => {
    setError('');

    // Dynamically load Razorpay script on-demand if not already loaded
    if (typeof window.Razorpay === 'undefined') {
      try {
        await new Promise((resolve, reject) => {
          if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
          const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
          if (existingScript) {
            if (window.Razorpay) return resolve(true);
            existingScript.addEventListener('load', () => resolve(true));
            existingScript.addEventListener('error', () => reject(new Error('Failed to load Razorpay SDK.')));
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve(true);
          script.onerror = () => reject(new Error('Failed to load Razorpay SDK.'));
          document.body.appendChild(script);
        });
      } catch {
        setError('Razorpay SDK failed to load. Please verify your connection or reload the page.');
        return;
      }
    }

    setSubmitting(true);

    try {
      // 1. Create order on backend
      const res = await api.post(`/payments/${order._id}/razorpay/create-order`);
      const { orderId, amount, currency, keyId } = res.data;

      if (!keyId) {
        throw new Error('Razorpay Key ID is not configured on the server.');
      }

      // 2. Configure Razorpay checkout options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency || 'INR',
        name: 'LaundryConnect',
        description: `Payment for Order #${order._id.slice(-6).toUpperCase()}`,
        image: '/icon-sparkle.png',
        order_id: orderId,
        handler: async function (response) {
          try {
            setVerifying(true);
            await api.post(`/payments/${order._id}/razorpay/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSuccess(true);
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 1200);
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.message || 'Payment verification failed. Please contact support.');
            setSubmitting(false);
          } finally {
            setVerifying(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#f59e0b',
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            setVerifying(false);
            setError('Payment checkout cancelled. You can retry whenever you are ready.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setSubmitting(false);
        setVerifying(false);
        setError(resp.error?.description || 'Payment failed. Please try again with another card or UPI.');
      });

      rzp.open();
    } catch (err) {
      console.error('Razorpay checkout initiation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initiate payment.');
      setSubmitting(false);
    }
  };

  const handleMockPay = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/payments/${order._id}/pay`, { paymentMethod: 'Mock Pay (Dev Test)' });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Payment simulation failed.');
      setSubmitting(false);
    }
  };

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
            disabled={submitting || verifying}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-elevated transition-colors disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-1.5 text-xs text-theme-accent uppercase tracking-widest font-bold mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Secure Razorpay Checkout</span>
          </div>
          <h2 className="text-xl font-black font-poppins">Complete Order Payment</h2>
          <p className="text-xs font-mono text-theme-muted mt-1 truncate">{order._id}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount Due Card with full cost breakdown */}
          <div className="bg-theme-elevated rounded-2xl p-4 border border-theme space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-theme-muted">Total Amount Due</span>
              <span className="text-2xl font-black text-theme-primary">₹{order.totalAmount}</span>
            </div>
            <div className="border-t border-theme/60 pt-2 space-y-1.5 text-xs text-theme-muted">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-theme-primary">₹{order.itemsSubtotal ?? order.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge{order.deliveryDistanceKm ? ` (${order.deliveryDistanceKm} km)` : ''}:</span>
                <span className="font-semibold text-theme-primary">
                  {order.deliveryCharge ? `₹${order.deliveryCharge}` : 'FREE'}
                </span>
              </div>
              {order.isExpress && (
                <div className="flex justify-between text-theme-accent">
                  <span>⚡ Express Delivery Fee:</span>
                  <span className="font-bold">+₹{order.expressFee || 150}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Gateway Trust Info */}
          <div className="bg-theme-surface rounded-2xl p-4 border border-theme text-left space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-theme-primary">
              <Lock className="h-4 w-4 text-theme-accent flex-shrink-0" />
              <span>Supported Payment Methods</span>
            </div>
            <p className="text-xs text-theme-muted leading-relaxed">
              Pay securely via UPI (GPay, PhonePe, Paytm), Debit/Credit Cards (Visa, Mastercard, RuPay), NetBanking, or Digital Wallets.
            </p>
            <div className="flex items-center space-x-3 pt-1 text-[11px] font-semibold text-theme-muted">
              <span className="inline-flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>256-Bit SSL</span>
              </span>
              <span className="inline-flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span>Instant Confirmation</span>
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-500 text-xs">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center space-x-2 bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-500 text-xs">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>Payment verified successfully! Updating your order…</span>
            </div>
          )}

          {/* Checkout Action Button */}
          <button
            onClick={handlePay}
            disabled={submitting || verifying || success}
            className="w-full flex items-center justify-center space-x-2 py-3.5 bg-theme-accent text-[var(--accent-text)] font-black rounded-2xl shadow-theme-accent transition-all disabled:opacity-60 disabled:cursor-not-allowed theme-btn-hover"
          >
            {verifying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Verifying Payment Signature…</span>
              </>
            ) : submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Launching Razorpay Gateway…</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                <span>Pay ₹{order.totalAmount} via Razorpay</span>
              </>
            )}
          </button>

          {/* Fallback Simulation Button for Dev Testing (disabled in production) */}
          {import.meta.env.DEV && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleMockPay}
                disabled={submitting || verifying || success}
                className="text-xs text-theme-muted hover:text-theme-accent transition-colors underline-offset-4 hover:underline disabled:opacity-50 py-1"
              >
                Simulate Test Payment (Mark as Paid)
              </button>
            </div>
          )}
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
      prev.map((o) => o._id === orderId ? { ...o, paymentStatus: 'Paid', paymentMethod: 'Razorpay', paidAt: new Date() } : o)
    );
    fetchOrders();
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
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-500 hover:bg-amber-500/25 rounded-xl text-xs font-bold transition-all"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry Payment</span>
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

              {/* ── Cost Breakdown Strip ───────────────────────────── */}
              <div className="bg-theme-elevated/70 rounded-2xl p-3.5 border border-theme flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-theme-muted">
                  <span>Items Subtotal: <strong className="text-theme-primary">₹{order.itemsSubtotal ?? order.totalAmount}</strong></span>
                  <span>Delivery{order.deliveryDistanceKm ? ` (${order.deliveryDistanceKm} km)` : ''}: <strong className="text-theme-primary">{order.deliveryCharge ? `₹${order.deliveryCharge}` : 'FREE'}</strong></span>
                  {order.isExpress && (
                    <span className="text-theme-accent font-semibold">⚡ Express Fee: +₹{order.expressFee || 150}</span>
                  )}
                </div>
                <div className="font-bold text-theme-primary">
                  Order Total: <span className="text-theme-accent font-black text-sm">₹{order.totalAmount}</span>
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
