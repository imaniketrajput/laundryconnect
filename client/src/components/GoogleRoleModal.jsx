import React, { useState } from 'react';
import { User, Bike, AlertCircle, ArrowRight, X, Check } from 'lucide-react';

const GoogleRoleModal = ({ isOpen, googleUser, onSubmit, onClose, submitting }) => {
  const [role, setRole] = useState('customer');
  const [vehicleType, setVehicleType] = useState('Bike');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !googleUser) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    onSubmit({
      role,
      vehicleType: role === 'partner' ? vehicleType : undefined,
      phone,
      address,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-theme-card border border-theme rounded-2xl sm:rounded-3xl shadow-theme-xl overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-role-modal-title"
      >
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 border-b border-theme bg-theme-elevated/40">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 rounded-xl text-theme-muted hover:text-theme-primary hover:bg-theme-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3.5">
            {googleUser.picture ? (
              <img
                src={googleUser.picture}
                alt={googleUser.name || 'Google Profile'}
                className="w-12 h-12 rounded-full border-2 border-theme-accent object-cover shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-theme-accent/10 border-2 border-theme-accent flex items-center justify-center text-theme-accent font-bold text-lg">
                {googleUser.name ? googleUser.name.charAt(0).toUpperCase() : 'G'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 id="google-role-modal-title" className="text-base sm:text-lg font-bold text-theme-primary truncate">
                Welcome, {googleUser.name}!
              </h3>
              <p className="text-xs text-theme-muted truncate">
                {googleUser.email}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          <p className="text-xs sm:text-sm text-theme-muted">
            Choose how you would like to use <strong className="text-theme-primary">LaundryConnect</strong> with your Google account.
          </p>

          {error && (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-xl text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selection Tabs (matches Register.jsx visual pattern) */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-theme-primary mb-2">
              I want to continue as a
            </label>
            <div className="grid grid-cols-2 gap-2 bg-theme-elevated p-1.5 rounded-2xl border border-theme">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-2.5 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all duration-200 ${
                  role === 'customer'
                    ? 'bg-theme-card text-theme-primary shadow-sm border border-theme'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Customer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('partner')}
                className={`py-2.5 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-1.5 transition-all duration-200 ${
                  role === 'partner'
                    ? 'bg-theme-card text-theme-primary shadow-sm border border-theme'
                    : 'text-theme-muted hover:text-theme-primary'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Delivery Partner</span>
              </button>
            </div>
          </div>

          {/* Role Description Card */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-theme-elevated/50 border border-theme text-xs text-theme-muted space-y-1">
            {role === 'customer' ? (
              <p>
                As a <strong className="text-theme-primary">Customer</strong>, you can schedule laundry pickups, customize garment care, track real-time wash progress, and pay seamlessly.
              </p>
            ) : (
              <p>
                As a <strong className="text-theme-primary">Delivery Partner</strong>, you can accept pickup & dropoff requests, navigate routes, update live statuses, and track your deliveries.
              </p>
            )}
          </div>

          {/* Additional details for Delivery Partner */}
          {role === 'partner' && (
            <div className="space-y-3.5 pt-1 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-theme-primary mb-1.5">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 bg-theme-elevated border border-theme rounded-xl text-theme-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                >
                  <option value="Bike">Bike / Motorcycle</option>
                  <option value="Scooter">Scooter</option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-primary mb-1.5">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-theme-elevated border border-theme rounded-xl text-theme-primary placeholder-theme-muted text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />
              </div>
            </div>
          )}

          {/* Customer Optional Contact/Address */}
          {role === 'customer' && (
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-theme-primary mb-1.5">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-theme-elevated border border-theme rounded-xl text-theme-primary placeholder-theme-muted text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-theme-accent"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl shadow-theme-accent text-sm font-bold text-[var(--accent-text)] bg-theme-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 theme-btn-hover"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <span>Continue as {role === 'partner' ? 'Delivery Partner' : 'Customer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleRoleModal;
