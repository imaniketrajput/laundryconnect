import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Mail, Lock, Phone, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, role, phone, address } = formData;
    if (!name || !email || !password || !phone || !address) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSubmitting(true);

    const result = await register(formData);
    setSubmitting(false);

    if (result.success) {
      if (role === 'partner') {
        // Partners need slots/location initialization, redirect to dashboard
        navigate('/partner');
      } else {
        navigate('/');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-navy-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-navy-900 p-3 rounded-2xl text-gold-500 shadow-xl shadow-navy-950/10">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-navy-900 font-poppins">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-navy-500">
          Or{' '}
          <Link to="/login" className="font-semibold text-gold-600 hover:text-gold-700 transition-colors">
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-navy-900/5 sm:rounded-3xl sm:px-10 border border-navy-100/50">
          {error && (
            <div className="mb-6 flex items-center space-x-2 bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection Tabs */}
            <div>
              <label className="block text-sm font-semibold text-navy-700 mb-2">I want to register as a</label>
              <div className="grid grid-cols-2 gap-2 bg-navy-50 p-1.5 rounded-2xl border border-navy-150">
                <button
                  type="button"
                  onClick={() => handleRoleChange('customer')}
                  className={`py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    formData.role === 'customer'
                      ? 'bg-white text-navy-950 shadow-md border border-navy-100'
                      : 'text-navy-500 hover:text-navy-900'
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('partner')}
                  className={`py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    formData.role === 'partner'
                      ? 'bg-white text-navy-950 shadow-md border border-navy-100'
                      : 'text-navy-500 hover:text-navy-900'
                  }`}
                >
                  Delivery Partner
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-navy-700">Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-navy-450" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-navy-50/50 border border-navy-200 rounded-xl text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent sm:text-sm font-sans"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-navy-700">Email Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-navy-450" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-navy-50/50 border border-navy-200 rounded-xl text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent sm:text-sm font-sans"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-navy-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-navy-450" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-navy-50/50 border border-navy-200 rounded-xl text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent sm:text-sm font-sans"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-navy-700">Phone Number</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-navy-450" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-navy-50/50 border border-navy-200 rounded-xl text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent sm:text-sm font-sans"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-navy-700">Address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                  <MapPin className="h-5 w-5 text-navy-450" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-navy-50/50 border border-navy-200 rounded-xl text-navy-900 placeholder-navy-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent sm:text-sm font-sans"
                  placeholder="House No, Street, Locality, City..."
                ></textarea>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-navy-900 hover:bg-navy-850 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    <span>Register</span>
                    <ArrowRight className="h-4 w-4 text-gold-500" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
