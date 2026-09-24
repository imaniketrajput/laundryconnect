import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocationProvider } from './context/LocationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';

// Pages
import Home from './pages/customer/Home';
import Services from './pages/customer/Services';
import SchedulePickup from './pages/customer/SchedulePickup';
import MyOrders from './pages/customer/MyOrders';
import TrackOrder from './pages/customer/TrackOrder';
import Profile from './pages/customer/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import PartnerProfile from './pages/partner/PartnerProfile';
import AdminDashboard from './pages/admin/AdminDashboard';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/services" element={<PageTransition><Services /></PageTransition>} />
        <Route path="/track" element={<PageTransition><TrackOrder /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

        {/* Customer Protected Routes */}
        <Route 
          path="/schedule" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <PageTransition><SchedulePickup /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-orders" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <PageTransition><MyOrders /></PageTransition>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute allowedRoles={['customer', 'admin']}>
              <PageTransition><Profile /></PageTransition>
            </ProtectedRoute>
          } 
        />

        {/* Partner Protected Routes */}
        <Route 
          path="/partner" 
          element={
            <ProtectedRoute allowedRoles={['partner']}>
              <PageTransition><PartnerDashboard /></PageTransition>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/partner/profile" 
          element={
            <ProtectedRoute allowedRoles={['partner']}>
              <PageTransition><PartnerProfile /></PageTransition>
            </ProtectedRoute>
          } 
        />

        {/* Admin Protected Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PageTransition><AdminDashboard /></PageTransition>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-theme-bg text-theme-primary transition-colors duration-200">
              <Navbar />
              <main className="flex-grow flex flex-col">
                <AnimatedRoutes />
              </main>
              <Footer />
            </div>
          </Router>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
