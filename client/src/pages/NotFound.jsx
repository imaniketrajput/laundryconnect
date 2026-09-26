import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sparkles, ArrowRight, HelpCircle, ShoppingBag, Truck } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex-grow flex items-center justify-center bg-theme-bg text-theme-primary px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative overflow-hidden transition-colors duration-200">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-theme-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full text-center relative z-10 space-y-8">
        {/* Animated Washing Machine / Spin Cycle Illustration */}
        <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          {/* Machine Outer Frame */}
          <div className="w-full h-full rounded-3xl bg-theme-card border-2 border-theme shadow-theme-lg flex flex-col items-center justify-between p-4 relative overflow-hidden">
            {/* Control panel top */}
            <div className="w-full flex items-center justify-between border-b border-theme pb-2.5 px-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-theme-accent animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <span className="font-mono text-[10px] font-black tracking-widest text-theme-accent uppercase bg-theme-accent-light px-2 py-0.5 rounded border border-theme-accent">
                ERR: 404
              </span>
            </div>

            {/* Circular Glass Porthole Door */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-theme-elevated border-4 border-theme flex items-center justify-center overflow-hidden shadow-inner">
              {/* Spinning Drum Highlights */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
                style={{ willChange: 'transform' }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-theme-accent/40 transform-gpu"
              />

              {/* Water Wave / Foam effect */}
              <motion.div
                animate={{ y: [4, -4, 4], rotate: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                style={{ willChange: 'transform' }}
                className="absolute -bottom-2 w-36 h-14 bg-gradient-to-t from-theme-accent/20 to-transparent rounded-full transform-gpu"
              />

              {/* Wandering Lost Sock SVG Illustration */}
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.05, 0.95, 1],
                  y: [-3, 3, -3],
                }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                style={{ willChange: 'transform' }}
                className="relative z-10 text-theme-accent flex flex-col items-center justify-center transform-gpu"
              >
                <svg
                  viewBox="0 0 64 64"
                  className="w-12 h-12 drop-shadow-md text-theme-accent fill-current"
                >
                  {/* Sock Outline */}
                  <path
                    d="M24 8 C24 6, 40 6, 40 8 L40 32 C40 36, 46 42, 52 46 C56 49, 56 54, 52 57 C48 60, 42 60, 36 56 C30 52, 24 44, 24 38 Z"
                    fill="currentColor"
                    opacity="0.85"
                  />
                  {/* Sock Stripes */}
                  <path d="M25 14 L39 14" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M25 20 L39 20" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Sock Toe patch */}
                  <path
                    d="M44 48 C49 52, 52 54, 50 56 C48 58, 44 56, 40 53 Z"
                    fill="#ffffff"
                    opacity="0.4"
                  />
                </svg>
              </motion.div>

              {/* Floating Bubbles */}
              <motion.div
                animate={{ y: [-15, -35], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeOut', delay: 0.2 }}
                style={{ willChange: 'transform, opacity' }}
                className="absolute bottom-6 left-8 w-2 h-2 rounded-full bg-white/70"
              />
              <motion.div
                animate={{ y: [-12, -30], opacity: [0.7, 0] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut', delay: 0.8 }}
                style={{ willChange: 'transform, opacity' }}
                className="absolute bottom-8 right-8 w-2.5 h-2.5 rounded-full bg-theme-accent/80"
              />
            </div>

            {/* Detergent Drawer / Bottom Base */}
            <div className="w-full flex justify-between items-center px-4 pt-1">
              <span className="w-8 h-1.5 rounded-full bg-theme-elevated" />
              <span className="w-4 h-1.5 rounded-full bg-theme-elevated" />
            </div>
          </div>
        </div>

        {/* Text Block */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold text-theme-accent bg-theme-accent-light border border-theme-accent">
            <Sparkles className="w-3.5 h-3.5" />
            <span>404 Error &bull; Page Not Found</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-poppins text-theme-primary tracking-tight">
            Lost in the <span className="text-theme-accent">Spin Cycle!</span>
          </h1>

          <p className="text-theme-muted text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Looks like this page got lost in the wash like an unmatched sock. Don’t worry — your clothes, profile, and orders are completely safe.
          </p>
        </div>

        {/* Primary and Secondary Action Links */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 font-bold px-7 py-3.5 rounded-2xl shadow-theme-accent transition-all duration-200 theme-btn-hover"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-text)',
            }}
          >
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/services"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 text-theme-primary font-bold px-6 py-3.5 rounded-2xl bg-theme-card hover:bg-theme-elevated border border-theme transition-all duration-200 theme-btn-hover"
          >
            <ShoppingBag className="h-4 w-4 text-theme-accent" />
            <span>Browse Services</span>
          </Link>
        </div>

        {/* Quick Helper Links Row */}
        <div className="border-t border-theme pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-theme-muted font-semibold">
          <Link to="/track" className="hover:text-theme-accent transition-colors flex items-center space-x-1.5">
            <Truck className="h-3.5 w-3.5" />
            <span>Track Order</span>
          </Link>
          <span>&bull;</span>
          <Link to="/faq" className="hover:text-theme-accent transition-colors flex items-center space-x-1.5">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Read FAQs</span>
          </Link>
          <span>&bull;</span>
          <Link to="/contact" className="hover:text-theme-accent transition-colors flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Contact Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
