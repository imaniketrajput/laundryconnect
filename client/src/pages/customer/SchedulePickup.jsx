import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import api from '../../api/axios';
import { 
  Calendar as CalendarIcon, MapPin, Truck, AlertTriangle, 
  Sparkles, CheckCircle2, ChevronRight, Plus, Minus, Trash2,
  Printer, Download, ArrowRight, ShieldCheck, RefreshCw, CreditCard,
  Loader2, Check, X, Bookmark
} from 'lucide-react';

const SchedulePickup = () => {
  const { user } = useAuth();
  const { detectedLocation, detectedAddress } = useLocation();
  const navigate = useNavigate();
  const [cart, setCart] = useState({});
  const [pickupAddress, setPickupAddress] = useState(user?.address || '');
  const [selectedLocation, setSelectedLocation] = useState(null); // { lat, lng }
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null); // '_id', 'detected', or 'custom'
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const isSelectedFromSuggestionRef = useRef(false);
  const dropdownRef = useRef(null);

  const [pickupDate, setPickupDate] = useState('');
  const [isExpress, setIsExpress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Payment-first state tracking
  const [pendingOrder, setPendingOrder] = useState(null);
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [verifiedInvoice, setVerifiedInvoice] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Load user saved addresses and auto-select default saved address
  useEffect(() => {
    let isMounted = true;
    const loadProfileAddresses = async () => {
      try {
        const res = await api.get('/users/profile');
        const list = res.data?.user?.savedAddresses;
        if (isMounted && Array.isArray(list) && list.length > 0) {
          setSavedAddresses(list);
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr._id);
            isSelectedFromSuggestionRef.current = true;
            setPickupAddress(defaultAddr.fullAddress);
            setSelectedLocation({ lat: defaultAddr.lat, lng: defaultAddr.lng });
            return;
          }
        }

        // If no saved addresses found, fallback to detected location if available
        if (isMounted && detectedAddress && detectedLocation) {
          setSelectedAddressId('detected');
          isSelectedFromSuggestionRef.current = true;
          setPickupAddress(detectedAddress);
          setSelectedLocation(detectedLocation);
        }
      } catch (err) {
        console.warn('[SchedulePickup] Profile addresses query non-critical error:', err.message);
      }
    };

    loadProfileAddresses();
    return () => {
      isMounted = false;
    };
  }, [detectedAddress, detectedLocation]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced address autocomplete against Nominatim proxy (/api/geocode/suggest)
  useEffect(() => {
    if (isSelectedFromSuggestionRef.current) {
      isSelectedFromSuggestionRef.current = false;
      return;
    }

    if (!pickupAddress || pickupAddress.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingAddress(true);
      try {
        const res = await api.get(`/geocode/suggest?q=${encodeURIComponent(pickupAddress.trim())}`);
        setSuggestions(res.data || []);
        setShowSuggestions((res.data || []).length > 0);
      } catch (err) {
        console.error('Failed to fetch address suggestions:', err);
      } finally {
        setSearchingAddress(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [pickupAddress]);

  const [deliveryEstimate, setDeliveryEstimate] = useState({
    distanceKm: null,
    deliveryCharge: null,
    rawDeliveryCharge: null,
    extraKm: 0,
    isFreeDelivery: false,
    isDistant: false,
    unverified: true,
    loading: false,
  });

  const handleSelectSuggestion = (suggestion) => {
    isSelectedFromSuggestionRef.current = true;
    setPickupAddress(suggestion.displayName);
    setSelectedLocation({ lat: suggestion.lat, lng: suggestion.lng });
    setSelectedAddressId('custom');
    setPendingOrder(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSelectSavedAddress = (addr) => {
    setSelectedAddressId(addr._id);
    isSelectedFromSuggestionRef.current = true;
    setPickupAddress(addr.fullAddress);
    setSelectedLocation({ lat: addr.lat, lng: addr.lng });
    setPendingOrder(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSelectCustomAddress = () => {
    setSelectedAddressId('custom');
    setPickupAddress('');
    setSelectedLocation(null);
    setPendingOrder(null);
  };

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
    setPendingOrder(null);
    localStorage.setItem('laundry_cart', JSON.stringify(newCart));
  };

  const handleRemove = (svcId) => {
    const newCart = { ...cart };
    delete newCart[svcId];
    setCart(newCart);
    setPendingOrder(null);
    localStorage.setItem('laundry_cart', JSON.stringify(newCart));
  };

  const cartItems = Object.values(cart);
  const subtotal = cartItems.reduce((sum, item) => sum + item.service.pricePerUnit * item.quantity, 0);

  // Authoritative dynamic delivery estimation query
  useEffect(() => {
    let active = true;

    const fetchEstimate = async () => {
      try {
        if (!selectedLocation || typeof selectedLocation.lat !== 'number' || typeof selectedLocation.lng !== 'number') {
          if (active) {
            setDeliveryEstimate({
              distanceKm: null,
              deliveryCharge: null,
              rawDeliveryCharge: null,
              extraKm: 0,
              isFreeDelivery: false,
              isDistant: false,
              unverified: true,
              loading: false,
            });
          }
          return;
        }

        if (active) {
          setDeliveryEstimate(prev => ({ ...prev, loading: true }));
        }

        const query = `itemsSubtotal=${subtotal}&lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`;
        const res = await api.get(`/orders/estimate-delivery?${query}`);
        if (active && res.data) {
          if (res.data.unverified) {
            setDeliveryEstimate({
              distanceKm: null,
              deliveryCharge: null,
              rawDeliveryCharge: null,
              extraKm: 0,
              isFreeDelivery: false,
              isDistant: false,
              unverified: true,
              loading: false,
            });
          } else {
            setDeliveryEstimate({
              distanceKm: res.data.distanceKm,
              deliveryCharge: res.data.deliveryCharge,
              rawDeliveryCharge: res.data.rawDeliveryCharge,
              extraKm: res.data.extraKm,
              isFreeDelivery: res.data.isFreeDelivery,
              isDistant: res.data.isDistant,
              unverified: false,
              loading: false,
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch delivery estimate:', err);
        if (active) {
          setDeliveryEstimate(prev => ({
            ...prev,
            distanceKm: null,
            deliveryCharge: null,
            rawDeliveryCharge: null,
            unverified: true,
            loading: false,
          }));
        }
      }
    };

    const timer = setTimeout(fetchEstimate, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedLocation, subtotal]);

  const expressFee = isExpress ? 150 : 0;
  const deliveryFee = deliveryEstimate.deliveryCharge;
  const grandTotal = deliveryFee !== null ? subtotal + expressFee + deliveryFee : null;

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
    if (!selectedLocation || typeof selectedLocation.lat !== 'number' || typeof selectedLocation.lng !== 'number') {
      setError('Please select an address from the suggestions dropdown to calculate accurate delivery distance.');
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
          pickupLocation: selectedLocation || undefined,
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
                    <td colSpan={3} className="py-2.5 px-4 font-semibold">
                      Delivery Charge{verifiedInvoice.deliveryDistanceKm ? ` (${verifiedInvoice.deliveryDistanceKm} km)` : ''}
                    </td>
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
              {/* Saved Addresses Chips */}
              {savedAddresses.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider">
                      Saved Addresses
                    </label>
                    <Link to="/profile" className="text-[11px] text-theme-accent hover:underline font-semibold">
                      Manage Addresses
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr._id}
                        type="button"
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                          selectedAddressId === addr._id
                            ? 'bg-theme-accent text-[var(--accent-text)] shadow-sm'
                            : 'bg-theme-elevated text-theme-muted hover:text-theme-primary border border-theme'
                        }`}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        <span>{addr.label || 'Home'}</span>
                        {addr.isDefault && <span className="text-[10px] opacity-80">(Default)</span>}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleSelectCustomAddress}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                        selectedAddressId === 'custom'
                          ? 'bg-theme-accent text-[var(--accent-text)]'
                          : 'bg-theme-elevated text-theme-muted hover:text-theme-primary border border-theme'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Other Address</span>
                    </button>
                  </div>
                </div>
              )}

              <div ref={dropdownRef} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider">
                    Pickup Address <span className="text-red-500">*</span>
                  </label>
                  {selectedLocation && typeof selectedLocation.lat === 'number' ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                      <Check className="h-3 w-3" />
                      <span>GPS Verified ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-500">
                      Selection from dropdown required
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-theme-accent" />
                  </div>
                  <textarea
                    required
                    rows="3"
                    value={pickupAddress}
                    onChange={(e) => {
                      setPickupAddress(e.target.value);
                      setSelectedLocation(null);
                      setSelectedAddressId('custom');
                      setPendingOrder(null);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="block w-full pl-10 pr-10 py-2.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent text-sm"
                    placeholder="Start typing your street address or locality (e.g. Koramangala, Indiranagar)..."
                  />
                  {searchingAddress && (
                    <div className="absolute top-3.5 right-3.5 flex items-center pointer-events-none">
                      <Loader2 className="h-4 w-4 animate-spin text-theme-accent" />
                    </div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 bg-theme-card border border-theme rounded-2xl shadow-theme-lg overflow-hidden max-h-60 overflow-y-auto divide-y divide-theme animate-in fade-in duration-150">
                    <div className="px-3 py-1.5 bg-theme-elevated/80 text-[10px] uppercase tracking-wider font-bold text-theme-muted flex items-center justify-between">
                      <span>Matching Addresses</span>
                      <span>Select to auto-geocode</span>
                    </div>
                    {suggestions.map((item, idx) => (
                      <button
                        key={item.placeId || idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-theme-elevated transition-colors flex items-start space-x-2.5 group"
                      >
                        <MapPin className="h-4 w-4 text-theme-muted group-hover:text-theme-accent mt-0.5 flex-shrink-0" />
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-semibold text-theme-primary truncate">
                            {item.displayName.split(',')[0]}
                          </p>
                          <p className="text-[11px] text-theme-muted truncate">
                            {item.displayName.split(',').slice(1).join(',').trim()}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-theme-accent bg-theme-accent-light px-1.5 py-0.5 rounded border border-theme-accent self-center flex-shrink-0">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-theme-muted mt-1.5">
                  &bull; Powered by OpenStreetMap Nominatim. Select a verified address to ensure accurate GPS dispatch.
                </p>
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
              <div className="flex justify-between items-baseline">
                <span>
                  Delivery Charge
                  {deliveryEstimate.distanceKm !== null && deliveryEstimate.distanceKm > 0 && (
                    <span className="text-[11px] font-mono text-theme-muted ml-1">
                      ({deliveryEstimate.distanceKm} km)
                    </span>
                  )}:
                </span>
                <span>
                  {deliveryEstimate.loading ? (
                    <span className="text-theme-muted text-xs animate-pulse">Calculating...</span>
                  ) : !selectedLocation || deliveryFee === null ? (
                    <span className="text-amber-500 font-semibold text-xs">Address Required</span>
                  ) : deliveryFee === 0 ? (
                    <span className="text-green-500 font-bold">
                      FREE {subtotal > 349 && <span className="text-[10px] text-theme-muted font-normal">(Order &gt; ₹349)</span>}
                    </span>
                  ) : (
                    <span className="font-bold text-theme-primary">₹{deliveryFee}</span>
                  )}
                </span>
              </div>
              {deliveryEstimate.extraKm > 0 && deliveryFee > 0 && (
                <p className="text-[10px] text-theme-muted -mt-1 text-right">
                  Base ₹20 (3 km) + ₹8/km for +{deliveryEstimate.extraKm} km
                </p>
              )}
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

            {/* Part 5 — Distant Delivery Informational Banner */}
            {deliveryEstimate.isDistant && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start space-x-2.5 text-amber-500 text-xs animate-in fade-in">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-400">Distant Address Notice</p>
                  <p className="text-theme-primary/90 text-[11px] leading-relaxed">
                    This address is far from our facility (~{deliveryEstimate.distanceKm} km) — delivery charge is ₹{deliveryFee} and turnaround may take longer than usual.
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-theme pt-4 flex justify-between items-end">
              <div>
                <span className="text-xs text-theme-muted uppercase font-bold">Total Payable</span>
                <p className="text-3xl font-black text-theme-primary">
                  {!selectedLocation || deliveryFee === null ? (
                    <>
                      ₹{subtotal + expressFee}{' '}
                      <span className="text-xs font-normal text-theme-muted">(+ delivery)</span>
                    </>
                  ) : (
                    `₹${grandTotal}`
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || cartItems.length === 0 || !selectedLocation || deliveryFee === null}
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-2xl shadow-theme-accent text-sm font-bold text-[var(--accent-text)] bg-theme-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 theme-btn-hover space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    Confirm &amp; Pay {selectedLocation && grandTotal !== null ? `(₹${grandTotal})` : ''}
                  </span>
                </>
              )}
            </button>

            {!selectedLocation && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-start space-x-2 animate-in fade-in">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Please select your address from the suggestions dropdown to calculate accurate delivery distance and proceed.
                </span>
              </div>
            )}

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
