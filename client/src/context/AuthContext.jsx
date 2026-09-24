import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

// Helper to evaluate profile completeness (100% threshold for verified badge)
export const isProfileComplete = (userData) => {
  if (!userData) return false;
  if (userData.role === 'partner') {
    const partner = userData.partner || {};
    const checks = [
      Boolean(userData.name),
      Boolean(userData.email),
      Boolean(userData.phone),
      Boolean(userData.profilePhoto || partner.profilePhoto),
      Boolean(partner.vehicleType || userData.vehicleType),
      Boolean(
        (partner.baseLocation?.lat && partner.baseLocation?.lng) ||
        (userData.baseLocation?.lat && userData.baseLocation?.lng)
      ),
    ];
    return checks.every(Boolean);
  }
  // Customer / Admin
  const checks = [
    Boolean(userData.name),
    Boolean(userData.email),
    Boolean(userData.phone),
    Boolean(userData.profilePhoto),
    Boolean(userData.savedAddresses && userData.savedAddresses.length > 0),
    Boolean(userData.dateOfBirth || userData.gender),
  ];
  return checks.every(Boolean);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount and sync latest profile data
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // ignore parse error
      }

      // Background sync to fetch fresh profile data (savedAddresses, profilePhoto, partner details)
      api.get('/users/profile')
        .then((res) => {
          if (res.data?.user) {
            const merged = { ...res.data.user, partner: res.data.partner };
            setUser(merged);
            localStorage.setItem('user', JSON.stringify(merged));
          }
        })
        .catch(() => {});
    }
    setLoading(false);
  }, []);

  const updateUser = (updatedData) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...updatedData };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // Hydrate full profile after login
      try {
        const profRes = await api.get('/users/profile');
        if (profRes.data?.user) {
          const merged = { ...profRes.data.user, partner: profRes.data.partner };
          setUser(merged);
          localStorage.setItem('user', JSON.stringify(merged));
        }
      } catch (err) {
        // non-blocking
      }

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user: registeredUser } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setUser(registeredUser);
      return { success: true, user: registeredUser };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Email might already be taken.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isComplete = isProfileComplete(user);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isProfileComplete: isComplete }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
