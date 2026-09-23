import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { 
  Calendar as CalendarIcon, MapPin, Truck, AlertTriangle, 
  Sparkles, CheckCircle2, ChevronRight, Plus, Minus, Trash2
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
  const [successOrder, setSuccessOrder] = useState(null);

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
      const orderServices = cartItems.map(item => ({
        service: item.service._id,
        quantity: item.quantity
      }));

      const response = await api.post('/orders', {
        services: orderServices,
        pickupAddress,
        pickupDate,
        isExpress
      });

      // Clear cart
      localStorage.removeItem('laundry_cart');
      setCart({});
      setSuccessOrder(response.data);

      setTimeout(() => {
        navigate('/my-orders');
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-theme-bg px-4 transition-colors duration-200">
        <div className="bg-theme-card p-8 max-w-md w-full rounded-3xl border border-theme shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-theme-accent-light text-theme-accent rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-theme-primary font-poppins">Order Placed Successfully!</h2>
            <p className="text-sm text-theme-muted">Your order has been queued. Redirecting to your dashboard...</p>
          </div>
          <div className="bg-theme-elevated p-4 rounded-2xl text-left border border-theme space-y-2">
            <div className="flex justify-between text-xs text-theme-muted">
              <span>Order ID:</span>
              <span className="font-mono font-bold text-theme-primary">{successOrder._id}</span>
            </div>
            <div className="flex justify-between text-xs text-theme-muted">
              <span>Status:</span>
              <span className="bg-theme-accent-light text-theme-accent px-2 py-0.5 rounded font-bold uppercase text-[9px] border border-theme-accent">
                {successOrder.currentStatus}
              </span>
            </div>
            <div className="flex justify-between text-xs text-theme-muted">
              <span>Total Amount:</span>
              <span className="font-extrabold text-theme-primary">₹{successOrder.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto transition-colors duration-200">
      <div className="mb-8 flex items-center space-x-2 text-xs font-bold text-theme-muted">
        <Link to="/services" className="hover:text-theme-primary transition-colors">Services</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-theme-accent">Checkout</span>
      </div>

      <h1 className="text-3xl font-extrabold text-theme-primary font-poppins mb-6">Schedule Your <span className="text-theme-accent">Pickup</span></h1>

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
              className="w-full flex justify-center items-center py-3.5 px-4 rounded-2xl shadow-theme-accent text-sm font-bold text-[var(--accent-text)] bg-theme-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 theme-btn-hover"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
              ) : (
                <span>Confirm Order (₹{grandTotal})</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePickup;
