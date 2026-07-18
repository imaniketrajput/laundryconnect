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
      <div className="min-h-[75vh] flex items-center justify-center bg-navy-50 px-4">
        <div className="bg-white p-8 max-w-md w-full rounded-3xl border border-navy-100 shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-gold-500/10 text-gold-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-navy-900 font-poppins">Order Placed Successfully!</h2>
            <p className="text-sm text-navy-500">Your order has been queued. Redirecting to your dashboard...</p>
          </div>
          <div className="bg-navy-50 p-4 rounded-2xl text-left border border-navy-100 space-y-2">
            <div className="flex justify-between text-xs text-navy-500">
              <span>Order ID:</span>
              <span className="font-mono font-bold text-navy-900">{successOrder._id}</span>
            </div>
            <div className="flex justify-between text-xs text-navy-500">
              <span>Status:</span>
              <span className="bg-gold-100 text-gold-700 px-2 py-0.5 rounded font-bold uppercase text-[9px]">{successOrder.currentStatus}</span>
            </div>
            <div className="flex justify-between text-xs text-navy-500">
              <span>Total Amount:</span>
              <span className="font-extrabold text-navy-900">₹{successOrder.totalAmount}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-50 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center space-x-2 text-xs font-bold text-navy-500">
        <Link to="/services" className="hover:text-navy-950 transition-colors">Services</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gold-600">Checkout</span>
      </div>

      <h1 className="text-3xl font-extrabold text-navy-900 font-poppins mb-6">Schedule Your <span className="text-gold-600">Pickup</span></h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Cart details and scheduling form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selected services card */}
          <div className="bg-white p-6 rounded-3xl border border-navy-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-navy-900 font-poppins">1. Review Selected Items</h2>
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-navy-500 mb-4">No items selected yet.</p>
                <Link to="/services" className="px-5 py-2.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-850">
                  Select Services
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-navy-50">
                {cartItems.map((item) => (
                  <div key={item.service._id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                    <div className="space-y-1 pr-4">
                      <h4 className="font-semibold text-sm text-navy-900">{item.service.name}</h4>
                      <p className="text-xs text-navy-400">₹{item.service.pricePerUnit} / {item.service.unit}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-navy-50 border border-navy-200 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.service._id, -1)}
                          className="p-1 hover:bg-navy-250 rounded transition-colors text-navy-600"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 text-xs font-bold text-navy-950">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.service._id, 1)}
                          className="p-1 hover:bg-navy-250 rounded transition-colors text-navy-600"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.service._id)}
                        className="text-navy-400 hover:text-red-600 p-1 transition-colors"
                        title="Remove item"
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
          <div className="bg-white p-6 rounded-3xl border border-navy-100 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-navy-900 font-poppins">2. Pickup Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5">Pickup Address</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-navy-400" />
                  </div>
                  <textarea
                    required
                    rows="3"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-navy-50/50 border border-navy-200 rounded-2xl text-navy-900 placeholder-navy-450 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent text-sm"
                    placeholder="Enter full address for pickup and delivery"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-700 uppercase tracking-wider mb-1.5">Pickup Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-navy-400" />
                  </div>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-navy-50/50 border border-navy-200 rounded-2xl text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Right column: Cart total summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-navy-100 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-navy-900 font-poppins border-b border-navy-50 pb-3">Price Summary</h3>
            
            <div className="space-y-3 text-sm text-navy-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-navy-950">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span>{deliveryFee === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              {isExpress && (
                <div className="flex justify-between text-gold-600 font-semibold bg-gold-50 p-2 rounded-xl border border-gold-100">
                  <span className="flex items-center space-x-1">
                    <Sparkles className="h-4 w-4 text-gold-500" />
                    <span>Express Fee:</span>
                  </span>
                  <span>+₹150</span>
                </div>
              )}
            </div>

            {/* Express Delivery Box */}
            <div className="bg-navy-50 p-4 rounded-2xl border border-navy-150 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-1.5 text-navy-850 font-bold text-sm">
                  <Truck className="h-4 w-4 text-gold-500" />
                  <span>Express Delivery</span>
                </span>
                <input
                  type="checkbox"
                  checked={isExpress}
                  onChange={(e) => setIsExpress(e.target.checked)}
                  className="w-4 h-4 text-gold-500 border-navy-300 rounded focus:ring-gold-500 focus:ring-2"
                />
              </div>
              <p className="text-[11px] text-navy-500 leading-normal">
                Deliver within 24 hours. Boosts your heap-based processing priority score.
              </p>
            </div>

            <div className="border-t border-navy-50 pt-4 flex justify-between items-end">
              <div>
                <span className="text-xs text-navy-450 uppercase font-bold">Total Payable</span>
                <p className="text-3xl font-black text-navy-950">₹{grandTotal}</p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || cartItems.length === 0}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-navy-900 hover:bg-navy-850 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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
