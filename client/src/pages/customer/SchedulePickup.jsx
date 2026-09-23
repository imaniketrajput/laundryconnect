import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { 
  Calendar as CalendarIcon, MapPin, Truck, AlertTriangle, 
  Sparkles, CheckCircle2, ChevronRight, Plus, Minus, Trash2,
  Printer, Download, ArrowRight, ShieldCheck, RefreshCw, CreditCard
} from 'lucide-react';

const SchedulePickup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState({});
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [pickupDate, setPickupDate] = useState('');
  const [isExpress, setIsExpress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Payment-first state tracking
  const [pendingOrder, setPendingOrder] = useState(null);
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [verifiedInvoice, setVerifiedInvoice] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('laundry_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart');
      }
    }
  }, []);

  const handleQtyChange = (svcId, amount) => {
    const newCart = { ...cart };
    if (!newCart[svcId]) return;
    newCart[svcId].quantity += amount;
    if (newCart[svcId].quantity <= 0) {
      delete newCart[svcId];
    }
    setCart(newCart);
    localStorage.setItem('laundry_cart', JSON.stringify(newCart));
  };

  const handleRemove = (svcId) => {
    const newCart = { ...cart };
    delete newCart[svcId];
    setCart(newCart);
    localStorage.setItem('laundry_cart', JSON.stringify(newCart));
  };

  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((sum, item) => sum + item.service.pricePerUnit * item.quantity, 0);
  const expressFee = isExpress ? 150 : 0;
  const deliveryFee = subtotal > 349 ? 0 : 49;
  const grandTotal = subtotal + expressFee + deliveryFee;

  // ─── Trigger Razorpay Checkout for an Order Record ──────────────────────────
  const launchRazorpayCheckout = async (order) => {
    if (typeof window.Razorpay === 'undefined') {
      setError('Razorpay SDK failed to load. Please check your internet connection or reload the page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await api.post(`/payments/${order._id}/razorpay/create-order`);
      const { orderId, amount, currency, keyId } = res.data;

      if (!keyId) {
        throw new Error('Razorpay Key ID is not configured on the server.');
      }

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
            setLoading(true);
            const verifyRes = await api.post(`/payments/${order._id}/razorpay/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // Payment verified & order activated
            localStorage.removeItem('laundry_cart');
            setCart({});
            setPendingOrder(null);
            setVerifiedOrder(verifyRes.data.order);
            setVerifiedInvoice(verifyRes.data.invoice);
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            setError(verifyErr.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
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
            setLoading(false);
            setError('Payment checkout cancelled. Your order is reserved as pending payment. You can retry anytime below.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setLoading(false);
        setError(resp.error?.description || 'Payment failed. Please try again with another card or UPI.');
      });

      rzp.open();
    } catch (err) {
      console.error('Razorpay checkout error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to initiate payment.');
      setLoading(false);
    }
  };

  // ─── Handle Initial Order Submission ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Your cart is empty. Please select services first.');
      return;
    }
    if (!pickupAddress.trim()) {
      setError('Please provide a pickup address.');
      return;
    }
    if (!pickupDate) {
      setError('Please select a pickup date.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let orderToPay = pendingOrder;

      // Only create order record if one does not already exist for this checkout attempt
      if (!orderToPay) {
        const orderServices = cartItems.map(item => ({
          service: item.service._id,
          quantity: item.quantity
        }));

        const response = await api.post('/orders', {
          services: orderServices,
          pickupAddress: pickupAddress.trim(),
          pickupDate,
          isExpress
        });

        orderToPay = response.data;
        setPendingOrder(orderToPay);
      }

      // Immediately launch payment modal
      await launchRazorpayCheckout(orderToPay);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to initiate order. Please try again.');
      setLoading(false);
    }
  };

  // ─── Download Authoritative PDF ─────────────────────────────────────────────
  const handleDownloadPdf = async (orderId, invoiceId) => {
    try {
      setDownloadingPdf(true);
      const res = await api.get(`/payments/${orderId}/invoice/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoiceId || orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download invoice PDF:', err);
      alert('Failed to download invoice PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ─── Print View ─────────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // ─── RENDER: Success Screen with Full Single-Source-of-Truth Invoice ─────────
  if (verifiedOrder && verifiedInvoice) {
    return (
      <>
        {/* Print-only CSS style injection */}
        <style>{`
          @media print {
            body > *:not(#order-success-print-root) { display: none !important; }
            #order-success-print-root { display: block !important; position: static !important; }
            .no-print { display: none !important; }
            .invoice-printable {
              box-shadow: none !important;
              border: none !important;
              max-width: 100% !important;
              padding: 0 !important;
              color: #000 !important;
              background: #fff !important;
            }
          }
        `}</style>

        <div id="order-success-print-root" className="min-h-screen bg-theme-bg text-theme-primary py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto transition-colors duration-200">
          {/* Success Banner */}
          <div className="no-print text-center mb-8 space-y-3">
            <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-500 border border-green-500/30 rounded-full flex items-center justify-center animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
            </div>
            <h1 className="text-3xl font-extrabold text-theme-primary font-poppins">Order Placed &amp; Paid!</h1>
            <p className="text-sm text-theme-muted max-w-md mx-auto">
              Your payment has been cryptographically verified and your order has been dispatched to our priority processing queue.
            </p>
          </div>

          {/* Printable Invoice Card */}
          <div className="invoice-printable bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header */}
            <div className="text-center border-b border-theme pb-6">
              <h2 className="text-2xl font-black text-theme-primary font-poppins tracking-tight">
                Laundry<span className="text-theme-accent">Connect</span>
              </h2>
              <p className="text-xs text-theme-muted mt-1">{verifiedInvoice.company?.tagline || 'Professional Fabric Care · Smart Pickup & Delivery'}</p>
              <span className="inline-block mt-3 px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                Official Tax Invoice
              </span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div>
                  <p className="font-bold text-theme-muted uppercase tracking-wider text-[10px]">Invoice ID</p>
                  <p className="font-mono font-bold text-theme-primary text-xs mt-0.5">{verifiedInvoice.invoiceId}</p>
                </div>
                <div>
                  <p className="font-bold text-theme-muted uppercase tracking-wider text-[10px]">Order ID</p>
                  <p className="font-mono text-theme-primary text-xs mt-0.5">{verifiedInvoice.orderId}</p>
                </div>
                <div>
                  <p className="font-bold text-theme-muted uppercase tracking-wider text-[10px]">Date &amp; Time</p>
                  <p className="text-theme-primary text-xs mt-0.5">{verifiedInvoice.paidAt || verifiedInvoice.orderDate}</p>
                </div>
                <div>
                  <p className="font-bold text-theme-muted uppercase tracking-wider text-[10px]">Payment Method</p>
                  <p className="text-theme-primary font-semibold text-xs mt-0.5">{verifiedInvoice.paymentMethod} ({verifiedInvoice.transactionId})</p>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <div>
                  <p className="font-bold text-theme-muted uppercase tracking-wider text-[10px]">Billed To</p>
                  <p className="font-bold text-theme-primary text-xs mt-0.5">{verifiedInvoice.customer?.name}</p>
                  <p className="text-theme-muted text-[11px]">{verifiedInvoice.customer?.email}</p>
                  {verifiedInvoice.customer?.phone && <p className="text-theme-muted text-[11px]">{verifiedInvoice.customer.phone}</p>}
                </div>
                <div>
                  <p className="font-bold text-theme-muted uppercase tracking-wider text-[10px]">Pickup Address</p>
                  <p className="text-theme-primary text-[11px] mt-0.5 leading-snug">{verifiedInvoice.customer?.address}</p>
                </div>
                <div>
                  <p className="font-bold text-theme-muted uppercase tracking-wider text-[10px]">Status</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded text-[10px] font-extrabold uppercase">
                    PAID &bull; VERIFIED
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-theme rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-theme-elevated text-theme-muted font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4 text-center">Qty / Unit</th>
                    <th className="py-3 px-4 text-right">Rate</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {(verifiedInvoice.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-theme-elevated/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-theme-primary">{item.name}</td>
                      <td className="py-3 px-4 text-center text-theme-muted">{item.quantity} {item.unit}</td>
                      <td className="py-3 px-4 text-right text-theme-muted">₹{item.pricePerUnit.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-theme-primary">₹{item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="divide-y divide-theme">
                  <tr className="bg-theme-elevated/40 text-theme-muted">
                    <td colSpan={3} className="py-2.5 px-4 font-semibold">Items Subtotal</td>
                    <td className="py-2.5 px-4 text-right font-bold text-theme-primary">₹{verifiedInvoice.itemsSubtotal.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-theme-elevated/40 text-theme-muted">
                    <td colSpan={3} className="py-2.5 px-4 font-semibold">Delivery Charge</td>
                    <td className="py-2.5 px-4 text-right font-bold text-theme-primary">
                      {verifiedInvoice.deliveryCharge > 0 ? `₹${verifiedInvoice.deliveryCharge.toFixed(2)}` : 'FREE'}
                    </td>
                  </tr>
                  {verifiedInvoice.isExpress && (
                    <tr className="bg-theme-elevated/40 text-theme-accent">
                      <td colSpan={3} className="py-2.5 px-4 font-semibold">⚡ Express Service Fee</td>
                      <td className="py-2.5 px-4 text-right font-bold">+₹{verifiedInvoice.expressFee.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-theme-elevated border-t-2 border-theme text-theme-primary">
                    <td colSpan={3} className="py-3.5 px-4 font-bold text-sm tracking-wide">Total Amount Paid</td>
                    <td className="py-3.5 px-4 text-right font-black text-xl text-theme-accent">₹{verifiedInvoice.totalAmount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Tax Note */}
            <div className="bg-theme-elevated/40 p-3 rounded-xl border border-theme text-[10px] text-theme-muted text-center space-y-1">
              <p>{verifiedInvoice.taxNote}</p>
              <p>{verifiedInvoice.termsNote}</p>
            </div>

            {/* Actions Bar */}
            <div className="no-print pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(verifiedOrder._id, verifiedInvoice.invoiceId)}
                  disabled={downloadingPdf}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-theme-accent text-[var(--accent-text)] rounded-xl text-xs font-bold theme-btn-hover transition-colors shadow-theme-sm disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>{downloadingPdf ? 'Downloading…' : 'Download Invoice (PDF)'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-theme-elevated border border-theme text-theme-primary hover:bg-theme-surface rounded-xl text-xs font-bold transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Invoice</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => navigate(`/track?id=${verifiedOrder._id}`)}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-theme-elevated border border-theme text-theme-primary hover:text-theme-accent rounded-xl text-xs font-bold transition-colors"
                >
                  <span>Track Order</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/my-orders')}
                  className="flex items-center space-x-1.5 px-4 py-2.5 bg-theme-accent-light border border-theme-accent text-theme-accent rounded-xl text-xs font-bold transition-colors"
                >
                  <span>My Orders</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── RENDER: Schedule & Payment Initiation Form ──────────────────────────────
  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto transition-colors duration-200">
      <div className="mb-8 flex items-center space-x-2 text-xs font-bold text-theme-muted">
        <Link to="/services" className="hover:text-theme-primary transition-colors">Services</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-theme-accent">Checkout &amp; Payment</span>
      </div>

      <h1 className="text-3xl font-extrabold text-theme-primary font-poppins mb-6">
        Schedule &amp; <span className="text-theme-accent">Confirm Pickup</span>
      </h1>

      {/* Pending Payment Recovery Banner (if user cancelled checkout or retry needed) */}
      {pendingOrder && (
        <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-amber-500 font-bold text-sm">
              <CreditCard className="h-4 w-4" />
              <span>Payment Pending for Order #{pendingOrder._id.slice(-6).toUpperCase()}</span>
            </div>
            <p className="text-xs text-theme-muted">
              Your order is saved with Total ₹{pendingOrder.totalAmount}. Complete payment now to activate priority dispatch.
            </p>
          </div>
          <button
            type="button"
            onClick={() => launchRazorpayCheckout(pendingOrder)}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-theme-accent text-[var(--accent-text)] rounded-xl text-xs font-bold shadow-theme-accent theme-btn-hover shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Retry Payment (₹{pendingOrder.totalAmount})</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Cart details and scheduling form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-2xl text-sm">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selected services card */}
          <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-theme-sm space-y-4">
            <h2 className="text-lg font-bold text-theme-primary font-poppins">1. Review Selected Items</h2>
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-theme-muted mb-4">No items selected yet.</p>
                <Link to="/services" className="px-5 py-2.5 bg-theme-accent text-[var(--accent-text)] rounded-xl text-xs font-bold theme-btn-hover">
                  Select Services
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-theme">
                {cartItems.map((item) => (
                  <div key={item.service._id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                    <div className="space-y-1 pr-4">
                      <h4 className="font-semibold text-sm text-theme-primary">{item.service.name}</h4>
                      <p className="text-xs text-theme-muted">₹{item.service.pricePerUnit} / {item.service.unit}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-theme-elevated border border-theme rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.service._id, -1)}
                          className="p-1 hover:bg-theme-surface rounded transition-colors text-theme-muted hover:text-theme-primary"
                          aria-label={`Decrease quantity of ${item.service.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-theme-primary">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.service._id, 1)}
                          className="p-1 hover:bg-theme-surface rounded transition-colors text-theme-muted hover:text-theme-primary"
                          aria-label={`Increase quantity of ${item.service.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.service._id)}
                        className="text-theme-muted hover:text-red-500 p-1 transition-colors"
                        title="Remove item"
                        aria-label={`Remove ${item.service.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Logistics card */}
          <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-theme-sm space-y-5">
            <h2 className="text-lg font-bold text-theme-primary font-poppins">2. Pickup Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-1.5">Pickup Address</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-theme-muted" />
                  </div>
                  <textarea
                    required
                    rows="3"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm"
                    placeholder="Enter full address for pickup and delivery"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-1.5">Pickup Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-theme-muted" />
                  </div>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Right column: Cart total summary */}
        <div className="space-y-6">
          <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-theme-sm space-y-5">
            <h3 className="text-lg font-bold text-theme-primary font-poppins border-b border-theme pb-3">Price Summary</h3>
            
            <div className="space-y-3 text-sm text-theme-muted">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-theme-primary">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span>{deliveryFee === 0 ? <span className="text-green-500 font-bold">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              {isExpress && (
                <div className="flex justify-between text-theme-accent font-semibold bg-theme-accent-light p-2 rounded-xl border border-theme-accent">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="h-4 w-4" />
                    <span>Express Fee:</span>
                  </span>
                  <span>+₹150</span>
                </div>
              )}
            </div>

            {/* Express Delivery Box */}
            <div className="bg-theme-elevated p-4 rounded-2xl border border-theme space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 text-theme-primary font-bold text-sm">
                  <Truck className="h-4 w-4 text-theme-accent" />
                  <span>Express Delivery</span>
                </span>
                <input
                  type="checkbox"
                  checked={isExpress}
                  onChange={(e) => setIsExpress(e.target.checked)}
                  className="w-4 h-4 text-theme-accent border-theme rounded focus:ring-theme-accent focus:ring-2"
                />
              </div>
              <p className="text-[11px] text-theme-muted leading-normal">
                Deliver within 24 hours. Boosts your heap-based processing priority score.
              </p>
            </div>

            <div className="border-t border-theme pt-4 flex justify-between items-end">
              <div>
                <span className="text-xs text-theme-muted uppercase font-bold">Total Payable</span>
                <p className="text-3xl font-black text-theme-primary">₹{grandTotal}</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || cartItems.length === 0}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-2xl shadow-theme-accent text-sm font-bold text-[var(--accent-text)] bg-theme-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 theme-btn-hover space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Confirm &amp; Pay (₹{grandTotal})</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-theme-muted text-center flex items-center justify-center space-x-1">
              <ShieldCheck className="h-3.5 w-3.5 text-theme-accent" />
              <span>Instant Razorpay checkout opens on confirmation</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePickup;
