import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import ServiceCard from '../../components/ServiceCard';
import { ServiceGridSkeleton } from '../../components/Skeleton';
import { Search, ShoppingBag, ArrowRight, RefreshCw } from 'lucide-react';

const CATEGORY_DISPLAY_NAMES = {
  'wash': 'Laundry',
  'dryclean': 'Dry Cleaning',
  'iron': 'Pressing',
  'shoes': 'Shoes'
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Cart state: { [serviceId]: { service, quantity } }
  const [cart, setCart] = useState({});
  const navigate = useNavigate();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('laundry_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
  }, []);

  // Fetch initial services
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await api.get('/services');
        setServices(res.data);
        setFilteredServices(res.data);

        // Extract unique categories from the fetched data
        const uniqueCategories = [...new Set(res.data.map(s => s.category).filter(Boolean))];
        setCategories(['All', ...uniqueCategories]);
      } catch (err) {
        console.error('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const searchDelay = setTimeout(async () => {
      if (searchQuery.trim() === '') {
        filterServices(services, selectedCategory);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/services/search?q=${encodeURIComponent(searchQuery)}`);
        filterServices(res.data, selectedCategory);
      } catch (err) {
        console.error('Search query failed:', err);
        // Fallback filter locally if backend search fails
        const matches = services.filter(s => 
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          s.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        filterServices(matches, selectedCategory);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchDelay);
  }, [searchQuery, selectedCategory, services]);

  const filterServices = (list, category) => {
    if (category === 'All') {
      setFilteredServices(list);
    } else {
      const filtered = list.filter(s => s.category === category);
      setFilteredServices(filtered);
    }
  };

  const handleAdd = (service) => {
    const newCart = { ...cart };
    if (newCart[service._id]) {
      newCart[service._id].quantity += 1;
    } else {
      newCart[service._id] = { service, quantity: 1 };
    }
    setCart(newCart);
    localStorage.setItem('laundry_cart', JSON.stringify(newCart));
  };

  const handleRemove = (service) => {
    const newCart = { ...cart };
    if (!newCart[service._id]) return;
    newCart[service._id].quantity -= 1;
    if (newCart[service._id].quantity <= 0) {
      delete newCart[service._id];
    }
    setCart(newCart);
    localStorage.setItem('laundry_cart', JSON.stringify(newCart));
  };

  const totalItems = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((sum, item) => sum + item.service.pricePerUnit * item.quantity, 0);

  const handleProceed = () => {
    navigate('/schedule');
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-primary py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-36 sm:pb-24 transition-colors duration-200">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-theme-primary font-poppins tracking-tight">
          Our Cleaning <span className="text-theme-accent">Services</span>
        </h1>
        <p className="text-theme-muted text-sm mt-1">
          Select the items you would like washed, dry cleaned, or pressed. Autocomplete live search is powered by our backend Trie system.
        </p>
      </div>

      {/* Search and Category Filters */}
      <div className="bg-theme-card p-4 sm:p-6 rounded-3xl border border-theme shadow-theme-sm space-y-4 sm:space-y-5 mb-8">
        <div className="relative rounded-2xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-theme-muted" />
          </div>
          <input
            type="text"
            placeholder="Search for dry cleaning, ironing, shoes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-4 py-3 sm:py-3.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent text-base sm:text-sm transition-colors"
          />
        </div>

        {/* Category Filters (Mobile-first wrapping - all 5 items fully visible) */}
        <div className="flex flex-wrap gap-2 pt-1 pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-theme-accent text-[var(--accent-text)] shadow-sm'
                  : 'bg-theme-elevated text-theme-muted border border-theme hover:bg-theme-surface hover:text-theme-primary'
              }`}
            >
              {cat === 'All' ? 'All' : (CATEGORY_DISPLAY_NAMES[cat] || cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid with Shimmer Skeleton */}
      {loading ? (
        <ServiceGridSkeleton count={8} />
      ) : filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.map(svc => (
            <ServiceCard
              key={svc._id}
              service={svc}
              onAdd={() => handleAdd(svc)}
              onRemove={() => handleRemove(svc)}
              quantity={cart[svc._id]?.quantity || 0}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-theme-card border border-theme rounded-3xl p-8 max-w-md mx-auto shadow-theme-sm">
          <RefreshCw className="h-12 w-12 text-theme-muted mx-auto mb-4" />
          <h3 className="text-lg font-bold text-theme-primary">No Services Found</h3>
          <p className="text-sm text-theme-muted mt-2">
            Try adjusting your search criteria or explore another category.
          </p>
        </div>
      )}

      {/* Floating Cart Drawer */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 w-full sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-[90%] sm:max-w-2xl bg-theme-surface text-theme-primary shadow-2xl rounded-t-3xl sm:rounded-3xl border-t sm:border border-theme p-3.5 sm:p-5 flex items-center justify-between z-40 transition-all duration-300">
          <div className="flex items-center space-x-2.5 sm:space-x-4 min-w-0">
            <div className="bg-theme-accent-light p-2 sm:p-3 rounded-xl sm:rounded-2xl text-theme-accent shrink-0">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold font-poppins truncate">{totalItems} Item{totalItems > 1 ? 's' : ''} Selected</p>
              <p className="text-[11px] sm:text-xs text-theme-muted">Subtotal: <span className="text-theme-accent font-extrabold text-xs sm:text-sm">₹{totalPrice}</span></p>
            </div>
          </div>
          
          <button
            onClick={handleProceed}
            className="flex items-center space-x-1.5 sm:space-x-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all theme-btn-hover shrink-0"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-text)',
            }}
          >
            <span><span className="hidden sm:inline">Proceed to </span>Checkout</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Services;
