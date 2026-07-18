import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/customer/Home';
import Services from './pages/customer/Services';
import SchedulePickup from './pages/customer/SchedulePickup';
import MyOrders from './pages/customer/MyOrders';
import TrackOrder from './pages/customer/TrackOrder';
import Login from './pages/Login';
import Register from './pages/Register';
import PartnerDashboard from './pages/partner/PartnerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-navy-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/track" element={<TrackOrder />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer Protected Routes */}
              <Route 
                path="/schedule" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <SchedulePickup />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-orders" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <MyOrders />
                  </ProtectedRoute>
                } 
              />

              {/* Partner Protected Routes */}
              <Route 
                path="/partner" 
                element={
                  <ProtectedRoute allowedRoles={['partner']}>
                    <PartnerDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Admin Protected Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
