import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, User, ClipboardList, Shield, Truck, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboard = () => {
    if (!user) return null;
    if (user.role === 'admin') return { label: 'Admin Dashboard', path: '/admin', icon: Shield };
    if (user.role === 'partner') return { label: 'Partner Dashboard', path: '/partner', icon: Truck };
    return { label: 'My Orders', path: '/my-orders', icon: ClipboardList };
  };

  const dashboard = getDashboard();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Track Order', path: '/track' },
  ];

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-3' : 'bg-white py-4 border-b border-navy-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-navy-900 p-2 rounded-xl text-gold-500 group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-navy-900 font-poppins">
                Laundry<span className="text-gold-500">Connect</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-semibold transition-colors duration-200 ${
                  location.pathname === link.path
                    ? 'text-gold-600 border-b-2 border-gold-500 pb-1'
                    : 'text-navy-600 hover:text-navy-950 hover:border-b-2 hover:border-navy-300 pb-1'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Side Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {dashboard && (
                  <Link
                    to={dashboard.path}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-navy-900 hover:bg-navy-850 hover:shadow-lg hover:shadow-navy-900/10 transition-all duration-200"
                  >
                    <dashboard.icon className="h-4 w-4 text-gold-500" />
                    <span>{dashboard.label}</span>
                  </Link>
                )}
                <div className="flex items-center space-x-2 text-navy-700 px-3 py-1.5 bg-navy-50 rounded-xl border border-navy-100">
                  <User className="h-4 w-4 text-navy-400" />
                  <span className="text-xs font-bold font-poppins">{user.name}</span>
                  <span className="text-[10px] bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 p-2 rounded-xl text-navy-500 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-navy-700 hover:text-navy-950 px-4 py-2 hover:bg-navy-50 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-gold-500 hover:bg-gold-600 px-5 py-2.5 rounded-xl shadow-md shadow-gold-500/10 hover:shadow-lg hover:shadow-gold-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Schedule Pickup
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-navy-600 hover:text-navy-950 hover:bg-navy-50 focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100 mt-2 border-t border-navy-100 bg-white shadow-inner' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-4 py-2 rounded-xl text-base font-semibold ${
                location.pathname === link.path
                  ? 'bg-gold-50 text-gold-600'
                  : 'text-navy-700 hover:bg-navy-50 hover:text-navy-950'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="border-t border-navy-100 pt-4 mt-4 space-y-2">
              <div className="px-4 py-2 flex items-center space-x-3 text-navy-700 bg-navy-50 rounded-xl">
                <User className="h-5 w-5 text-navy-400" />
                <div>
                  <div className="text-sm font-bold">{user.name}</div>
                  <div className="text-xs text-navy-400 capitalize">{user.role}</div>
                </div>
              </div>
              {dashboard && (
                <Link
                  to={dashboard.path}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-base font-semibold text-white bg-navy-900 rounded-xl hover:bg-navy-850"
                >
                  <dashboard.icon className="h-5 w-5 text-gold-500" />
                  <span>{dashboard.label}</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full px-4 py-2 text-base font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100"
              >
                <LogOut className="h-5 w-5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-navy-100 pt-4 mt-4 space-y-2">
              <Link
                to="/login"
                className="block text-center w-full px-4 py-2 border border-navy-200 text-base font-semibold text-navy-700 rounded-xl hover:bg-navy-50"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block text-center w-full px-4 py-2.5 text-base font-semibold text-white bg-gold-500 rounded-xl hover:bg-gold-600"
              >
                Schedule Pickup
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
