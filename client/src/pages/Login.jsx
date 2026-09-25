import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import GoogleRoleModal from '../components/GoogleRoleModal';
import { Sparkles, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, googleAuth } = useAuth();
  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Google OAuth state
  const [pendingCredential, setPendingCredential] = useState(null);
  const [googleUserData, setGoogleUserData] = useState(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const redirectRoleBased = (role) => {
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'partner') {
      navigate('/partner');
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setSubmitting(true);

    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      redirectRoleBased(result.user?.role);
    } else {
      setError(result.message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    const credential = credentialResponse.credential;
    if (!credential) {
      setError('Google authentication failed: no credential received from Google.');
      return;
    }

    setSubmitting(true);
    const result = await googleAuth({ credential });
    setSubmitting(false);

    if (result.success) {
      if (result.newGoogleUser) {
        // Show role selection modal for new user
        setPendingCredential(credential);
        setGoogleUserData(result.googleUser);
        setRoleModalOpen(true);
      } else {
        // Existing user or already linked
        redirectRoleBased(result.user?.role);
      }
    } else {
      setError(result.message);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was unsuccessful or closed. Please try again.');
  };

  const handleRoleSelectionSubmit = async ({ role, vehicleType, phone, address }) => {
    setRoleSubmitting(true);
    setError('');

    const result = await googleAuth({
      credential: pendingCredential,
      role,
      vehicleType,
      phone,
      address,
    });
    setRoleSubmitting(false);

    if (result.success && !result.newGoogleUser) {
      setRoleModalOpen(false);
      redirectRoleBased(result.user?.role);
    } else {
      setError(result.message || 'Failed to complete Google account registration.');
    }
  };

  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);


  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-theme-bg text-theme-primary transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-theme-elevated p-3 rounded-2xl text-theme-accent border border-theme shadow-theme-md">
            <Sparkles className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-theme-primary font-poppins">
          Welcome back to <span className="text-theme-accent">LaundryConnect</span>
        </h2>
        <p className="mt-2 text-center text-sm text-theme-muted">
          Or{' '}
          <Link to="/register" className="font-semibold text-theme-accent hover:underline transition-colors">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-theme-card py-8 px-4 sm:px-10 shadow-theme-md rounded-2xl sm:rounded-3xl border border-theme">
          {error && (
            <div className="mb-6 flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-500 p-3.5 rounded-xl text-sm">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-theme-primary">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-theme-muted" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-theme-elevated border border-theme rounded-xl text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent text-base sm:text-sm font-sans"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-theme-primary">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-theme-muted" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-theme-elevated border border-theme rounded-xl text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent text-base sm:text-sm font-sans"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center space-x-2 py-3 px-4 rounded-xl shadow-theme-accent text-sm font-bold text-[var(--accent-text)] bg-theme-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 theme-btn-hover"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Social Sign-In Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-theme" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-theme-card px-2 text-theme-muted font-semibold tracking-wider">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div className="flex flex-col items-center justify-center w-full min-h-[44px]">
            {hasGoogleClientId ? (
              <div className="w-full flex justify-center">
                <div className="w-[368px] max-w-full rounded-xl overflow-hidden border border-[#dadce0] bg-white flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    text="continue_with"
                    width="368"
                    logo_alignment="center"
                  />
                </div>
              </div>
            ) : (
              <div className="w-full p-3 rounded-xl bg-theme-elevated border border-theme text-center text-xs text-theme-muted">
                Google Sign-In is ready on the server. Add <code className="text-theme-accent">VITE_GOOGLE_CLIENT_ID</code> to enable.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Selection Modal for New Google Users */}
      <GoogleRoleModal
        isOpen={roleModalOpen}
        googleUser={googleUserData}
        onSubmit={handleRoleSelectionSubmit}
        onClose={() => setRoleModalOpen(false)}
        submitting={roleSubmitting}
      />
    </div>
  );
};

export default Login;
