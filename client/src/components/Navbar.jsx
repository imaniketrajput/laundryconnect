import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeSwitcher from './ThemeSwitcher';
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
        isScrolled
          ? 'bg-theme-surface/95 backdrop-blur-md shadow-theme-md py-3 border-b border-theme'
          : 'bg-theme-surface py-4 border-b border-theme'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="p-2 rounded-xl bg-theme-elevated text-theme-accent border border-theme group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-theme-primary font-poppins">
                Laundry<span className="text-theme-accent">Connect</span>
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
                    ? 'text-theme-accent border-b-2 border-theme-accent pb-1'
                    : 'text-theme-muted hover:text-theme-primary hover:border-b-2 hover:border-theme pb-1'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Side Auth & Theme Switcher */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Theme Switcher Popover Button */}
            <ThemeSwitcher />

            {user ? (
              <div className="flex items-center space-x-3">
                {dashboard && (
                  <Link
                    to={dashboard.path}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-theme-primary bg-theme-elevated hover:bg-theme-hover border border-theme transition-all duration-200 theme-btn-hover"
                  >
                    <dashboard.icon className="h-4 w-4 text-theme-accent" />
                    <span>{dashboard.label}</span>
                  </Link>
                )}
                <div className="flex items-center space-x-2 text-theme-primary px-3 py-1.5 bg-theme-elevated rounded-xl border border-theme">
                  <User className="h-4 w-4 text-theme-muted" />
                  <span className="text-xs font-bold font-poppins">{user.name}</span>
                  <span className="text-[10px] bg-theme-accent-light text-theme-accent border border-theme-accent px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 p-2 rounded-xl text-theme-muted hover:text-red-500 hover:bg-red-500/10 transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-theme-primary hover:text-theme-accent px-4 py-2 hover:bg-theme-elevated rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 theme-btn-hover"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                  }}
                >
                  Schedule Pickup
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button and Theme Switcher */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-theme-primary hover:bg-theme-elevated focus:outline-none transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100 mt-2 border-t border-theme bg-theme-surface shadow-inner' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pt-3 pb-5 space-y-2 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`block px-4 py-2.5 rounded-xl text-base font-semibold transition-colors ${
                location.pathname === link.path
                  ? 'bg-theme-accent-light text-theme-accent font-bold'
                  : 'text-theme-primary hover:bg-theme-elevated'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Inline Theme Switcher for mobile drawer */}
          <div className="pt-2 border-t border-theme">
            <ThemeSwitcher compact />
          </div>

          {user ? (
            <div className="border-t border-theme pt-3 mt-3 space-y-2">
              <div className="px-4 py-2.5 flex items-center space-x-3 text-theme-primary bg-theme-elevated rounded-xl border border-theme">
                <User className="h-5 w-5 text-theme-muted" />
                <div>
                  <div className="text-sm font-bold">{user.name}</div>
                  <div className="text-xs text-theme-muted capitalize">{user.role}</div>
                </div>
              </div>
              {dashboard && (
                <Link
                  to={dashboard.path}
                  className="flex items-center space-x-2 w-full px-4 py-2.5 text-base font-semibold text-theme-primary bg-theme-elevated rounded-xl border border-theme hover:bg-theme-hover"
                >
                  <dashboard.icon className="h-5 w-5 text-theme-accent" />
                  <span>{dashboard.label}</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full px-4 py-2.5 text-base font-semibold text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="border-t border-theme pt-3 mt-3 space-y-2">
              <Link
                to="/login"
                className="block text-center w-full px-4 py-2.5 border border-theme text-base font-semibold text-theme-primary rounded-xl hover:bg-theme-elevated transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="block text-center w-full px-4 py-2.5 text-base font-semibold rounded-xl shadow-md transition-all duration-200 theme-btn-hover"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text)',
                }}
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
