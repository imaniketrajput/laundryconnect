import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  MessageSquare,
  Search,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  RefreshCw,
  FileText,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

const STATUS_CONFIG = {
  Pending: {
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500 text-slate-950 font-bold',
    label: 'Pending Review',
    desc: 'Your ticket has been received and is waiting in the support queue for an engineer or support agent.',
  },
  'In Progress': {
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500 text-white font-bold',
    label: 'In Progress',
    desc: 'A support representative is actively investigating your request or coordinating with the delivery team.',
  },
  Resolved: {
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500 text-white font-bold',
    label: 'Resolved',
    desc: 'Your issue has been addressed. Please review the resolution notes below.',
  },
  Closed: {
    color: 'text-gray-400',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
    badge: 'bg-gray-600 text-white font-bold',
    label: 'Closed',
    desc: 'This support ticket has been closed. If you require further assistance, please open a new ticket.',
  },
};

const Contact = () => {
  const { user } = useAuth();

  // Active view: 'submit' or 'lookup'
  const [activeView, setActiveView] = useState('submit');

  // Submit form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
    relatedOrderId: '',
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null); // { ticketToken, subject }
  const [submitError, setSubmitError] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  // Status lookup state
  const [lookupToken, setLookupToken] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');

  // Auto-fill user information if user logs in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));

      // Fetch user's recent orders for quick attachment dropdown
      api
        .get('/orders')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setRecentOrders(res.data.slice(0, 10));
          }
        })
        .catch(() => {
          // Non-critical, ignore
        });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await api.post('/support/tickets', formData);
      setSubmitSuccess({
        ticketToken: res.data.ticketToken,
        subject: formData.subject,
      });

      // Clear non-contact fields
      setFormData((prev) => ({
        ...prev,
        subject: '',
        message: '',
        relatedOrderId: '',
      }));
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        'Unable to submit support ticket. Please check your connection and try again.';
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookup = async (tokenToSearch) => {
    const token = (tokenToSearch || lookupToken).trim().toUpperCase();
    if (!token) {
      setLookupError('Please enter a valid ticket token (e.g. LC-AB12CD)');
      return;
    }

    setIsLookingUp(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const res = await api.get(`/support/tickets/${encodeURIComponent(token)}`);
      setLookupResult(res.data.ticket);
    } catch (err) {
      const msg =
        err.response?.status === 404
          ? `No ticket found with reference code "${token}". Please check the token and try again.`
          : 'Failed to retrieve ticket status. Please try again.';
      setLookupError(msg);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const switchToLookupWithToken = (token) => {
    setLookupToken(token);
    setActiveView('lookup');
    handleLookup(token);
  };

  return (
    <div className="bg-theme-bg text-theme-primary overflow-x-hidden font-sans transition-colors duration-200">
      {/* ── 1. HERO HEADER ─────────────────────────────────────────────────── */}
      <section className="relative bg-theme-hero text-theme-hero py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-theme">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full blur-3xl pointer-events-none floating-blob-1" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 rounded-full blur-3xl pointer-events-none floating-blob-2" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-theme-accent border border-white/15 text-xs font-bold font-poppins uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer Support &amp; Inquiries</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight font-poppins text-theme-hero">
            How Can We <span className="text-theme-accent">Help You?</span>
          </h1>

          <p className="text-theme-hero-muted text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Have a question about an order, need fabric guidance, or looking to check an existing ticket? Our dedicated team is here for you.
          </p>

          {/* View Switcher Pills */}
          <div className="inline-flex p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 gap-2 mt-4">
            <button
              onClick={() => setActiveView('submit')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeView === 'submit'
                  ? 'bg-theme-accent text-theme-accent-text shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Submit a Ticket</span>
            </button>
            <button
              onClick={() => setActiveView('lookup')}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeView === 'lookup'
                  ? 'bg-theme-accent text-theme-accent-text shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Check Ticket Status</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. MAIN CONTENT AREA ────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Left Column: Direct Contact Details & Info */}
          <div className="space-y-6">
            <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 shadow-theme-sm space-y-6">
              <h3 className="text-lg font-bold text-theme-primary font-poppins border-l-4 border-theme-accent pl-3">
                Contact Information
              </h3>
              <p className="text-xs sm:text-sm text-theme-muted leading-relaxed">
                Reach out to our operations hub directly. Whether you need urgent dispatch assistance or fabric care questions, our support engineers are standing by.
              </p>

              <div className="space-y-4 pt-2 text-sm">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-theme-elevated text-theme-accent border border-theme shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block">Official Email</span>
                    <a
                      href="mailto:as.thakuraniket@gmail.com"
                      className="text-theme-primary font-semibold hover:text-theme-accent transition-colors"
                    >
                      as.thakuraniket@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-theme-elevated text-theme-accent border border-theme shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block">Phone &amp; WhatsApp</span>
                    <a
                      href="tel:+918650865586"
                      className="text-theme-primary font-semibold hover:text-theme-accent transition-colors"
                    >
                      +91 86508 65586
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-theme-elevated text-theme-accent border border-theme shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block">Central Facility Hub</span>
                    <p className="text-theme-primary font-medium">
                      Jalandhar Central Laundry Hub, Punjab 144001, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-theme-elevated text-theme-accent border border-theme shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block">Support Hours</span>
                    <p className="text-theme-primary font-medium">
                      Monday &ndash; Sunday &bull; 8:00 AM &ndash; 9:00 PM IST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Mini-Lookup Card when in submit view */}
            {activeView === 'submit' && (
              <div className="bg-theme-card border border-theme rounded-3xl p-6 shadow-theme-sm space-y-4">
                <div className="flex items-center space-x-2 text-theme-accent">
                  <Search className="h-4 w-4" />
                  <h4 className="text-sm font-bold font-poppins text-theme-primary">Already have a ticket?</h4>
                </div>
                <p className="text-xs text-theme-muted">
                  Enter your ticket token below to check current resolution status without logging in.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. LC-AB12CD"
                    value={lookupToken}
                    onChange={(e) => setLookupToken(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono font-bold uppercase px-3 py-2 bg-theme-elevated border border-theme rounded-xl text-theme-primary focus:outline-none focus:border-theme-accent"
                  />
                  <button
                    onClick={() => switchToLookupWithToken(lookupToken)}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-theme-accent text-theme-accent-text shrink-0 theme-btn-hover"
                  >
                    Check
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Dynamic Form (Submit Ticket OR Check Status) */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {activeView === 'submit' ? (
                <motion.div
                  key="submit-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-10 shadow-theme-sm"
                >
                  {/* Success State Banner */}
                  {submitSuccess ? (
                    <div className="space-y-6">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div>
                          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">Ticket Created Successfully</span>
                          <h3 className="text-2xl font-black text-theme-primary font-poppins mt-1">
                            {submitSuccess.subject}
                          </h3>
                        </div>

                        {/* Prominent Ticket Token Display */}
                        <div className="bg-theme-elevated border border-theme rounded-2xl p-4 max-w-sm mx-auto flex items-center justify-between">
                          <div className="text-left">
                            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Your Ticket Token</span>
                            <span className="text-xl sm:text-2xl font-black font-mono text-theme-accent">
                              {submitSuccess.ticketToken}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(submitSuccess.ticketToken)}
                            className="p-2.5 rounded-xl bg-theme-card hover:bg-theme-accent hover:text-white border border-theme text-theme-primary transition-colors flex items-center gap-1.5 text-xs font-bold"
                          >
                            {copiedToken ? (
                              <>
                                <Check className="h-4 w-4 text-emerald-500" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm text-theme-muted max-w-md mx-auto leading-relaxed">
                          Please <strong>save this token</strong> to track your ticket’s progress. We have also dispatched a confirmation email to your inbox.
                        </p>

                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                          <button
                            onClick={() => switchToLookupWithToken(submitSuccess.ticketToken)}
                            className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-theme-accent text-theme-accent-text shadow-sm theme-btn-hover"
                          >
                            Track Ticket Status Now
                          </button>
                          <button
                            onClick={() => setSubmitSuccess(null)}
                            className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-theme-elevated hover:bg-theme-hover border border-theme text-theme-primary transition-colors"
                          >
                            Submit Another Request
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* The Submit Form */
                    <form onSubmit={handleSubmitTicket} className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-extrabold text-theme-primary font-poppins">
                          Submit a Support Ticket
                        </h2>
                        <p className="text-xs sm:text-sm text-theme-muted mt-1">
                          Fill out the form below. A trackable token will be issued immediately.
                        </p>
                      </div>

                      {submitError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs sm:text-sm p-4 rounded-2xl flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 shrink-0" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Name */}
                        <div>
                          <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-2">
                            Your Name <span className="text-theme-accent">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Aniket Rajput"
                            className="w-full text-sm px-4 py-3 bg-theme-elevated border border-theme rounded-2xl text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                          />
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-2">
                            Email Address <span className="text-theme-accent">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="e.g. customer@example.com"
                            className="w-full text-sm px-4 py-3 bg-theme-elevated border border-theme rounded-2xl text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                          />
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-2">
                          Subject <span className="text-theme-accent">*</span>
                        </label>
                        <input
                          type="text"
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="e.g. Question about express delivery slot or delicate garment care"
                          className="w-full text-sm px-4 py-3 bg-theme-elevated border border-theme rounded-2xl text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                        />
                      </div>

                      {/* Optional Related Order */}
                      <div>
                        <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-2">
                          Related Order <span className="text-theme-muted font-normal lowercase">(optional)</span>
                        </label>
                        {recentOrders.length > 0 ? (
                          <select
                            name="relatedOrderId"
                            value={formData.relatedOrderId}
                            onChange={handleChange}
                            className="w-full text-sm px-4 py-3 bg-theme-elevated border border-theme rounded-2xl text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                          >
                            <option value="">None / Not Order Specific</option>
                            {recentOrders.map((ord) => (
                              <option key={ord._id} value={ord._id}>
                                Order #{ord._id.slice(-8).toUpperCase()} &bull; ₹{ord.totalAmount} ({ord.currentStatus}) &bull; {ord.pickupDate}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="relatedOrderId"
                            value={formData.relatedOrderId}
                            onChange={handleChange}
                            placeholder="Paste 24-character Order ID if applicable"
                            className="w-full text-sm px-4 py-3 bg-theme-elevated border border-theme rounded-2xl text-theme-primary focus:outline-none focus:border-theme-accent transition-colors"
                          />
                        )}
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-xs font-bold text-theme-primary uppercase tracking-wider mb-2">
                          Detailed Message <span className="text-theme-accent">*</span>
                        </label>
                        <textarea
                          name="message"
                          required
                          rows={5}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Please describe your inquiry or concern in detail so we can assist promptly..."
                          className="w-full text-sm px-4 py-3 bg-theme-elevated border border-theme rounded-2xl text-theme-primary focus:outline-none focus:border-theme-accent transition-colors resize-y leading-relaxed"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 font-bold px-8 py-4 rounded-2xl shadow-theme-accent transition-all duration-200 theme-btn-hover disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-text)',
                          }}
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="h-5 w-5 animate-spin" />
                              <span>Submitting Ticket...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Support Ticket</span>
                              <Send className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              ) : (
                /* The Status Lookup View */
                <motion.div
                  key="lookup-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-10 shadow-theme-sm space-y-8"
                >
                  <div>
                    <h2 className="text-2xl font-extrabold text-theme-primary font-poppins">
                      Check Ticket Status
                    </h2>
                    <p className="text-xs sm:text-sm text-theme-muted mt-1">
                      Enter the unique ticket reference code (e.g. LC-AB12CD) provided upon submission.
                    </p>
                  </div>

                  {/* Lookup Bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                      <Search className="absolute left-4 top-3.5 h-5 w-5 text-theme-muted pointer-events-none" />
                      <input
                        type="text"
                        value={lookupToken}
                        onChange={(e) => setLookupToken(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                        placeholder="Enter Ticket Token (e.g. LC-9E2F1B)"
                        className="w-full pl-12 pr-4 py-3.5 bg-theme-elevated border border-theme rounded-2xl text-theme-primary text-sm font-mono font-bold uppercase focus:outline-none focus:border-theme-accent transition-colors"
                      />
                    </div>
                    <button
                      onClick={() => handleLookup()}
                      disabled={isLookingUp}
                      className="inline-flex items-center justify-center space-x-2 font-bold px-7 py-3.5 rounded-2xl shadow-theme-accent transition-all duration-200 theme-btn-hover disabled:opacity-50"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      {isLookingUp ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          <span>Check Status</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Error Notification */}
                  {lookupError && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs sm:text-sm p-4 rounded-2xl flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span>{lookupError}</span>
                    </div>
                  )}

                  {/* Ticket Result Details Card */}
                  {lookupResult && (
                    <div className="border border-theme bg-theme-elevated/40 rounded-3xl p-6 sm:p-8 space-y-6">
                      {/* Status Banner */}
                      {(() => {
                        const conf = STATUS_CONFIG[lookupResult.status] || STATUS_CONFIG['Pending'];
                        return (
                          <div className={`p-4 sm:p-5 rounded-2xl border ${conf.bg} ${conf.border} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-theme-muted">
                                Current Lifecycle Status
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${conf.badge}`}>
                                  {lookupResult.status}
                                </span>
                                <span className="text-xs font-semibold text-theme-muted hidden sm:inline">
                                  &bull; {conf.label}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-theme-muted">
                              Last updated:{' '}
                              {lookupResult.updatedAt
                                ? new Date(lookupResult.updatedAt).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Just now'}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Ticket Properties */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm border-b border-theme pb-6">
                        <div>
                          <span className="text-theme-muted text-xs block mb-1">Ticket Reference</span>
                          <span className="font-mono font-bold text-theme-accent text-base">
                            {lookupResult.ticketToken}
                          </span>
                        </div>
                        <div>
                          <span className="text-theme-muted text-xs block mb-1">Submitted Date</span>
                          <span className="font-medium text-theme-primary">
                            {new Date(lookupResult.createdAt).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Subject & Message */}
                      <div className="space-y-3">
                        <h4 className="text-base sm:text-lg font-bold text-theme-primary font-poppins">
                          {lookupResult.subject}
                        </h4>
                        <div className="bg-theme-card border border-theme rounded-2xl p-4 text-xs sm:text-sm text-theme-muted leading-relaxed whitespace-pre-wrap">
                          {lookupResult.message}
                        </div>
                      </div>

                      {/* Resolution Notes if Available */}
                      {lookupResult.resolutionNotes && (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-2">
                          <div className="flex items-center space-x-2 text-emerald-500">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Support Resolution Notes</span>
                          </div>
                          <p className="text-xs sm:text-sm text-theme-primary leading-relaxed whitespace-pre-wrap">
                            {lookupResult.resolutionNotes}
                          </p>
                          {lookupResult.resolvedAt && (
                            <span className="text-[11px] text-theme-muted block pt-1">
                              Resolved on: {new Date(lookupResult.resolvedAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Related Order Reference */}
                      {lookupResult.relatedOrderDetails && (
                        <div className="bg-theme-card border border-theme rounded-2xl p-4 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-theme-muted block">Linked Order</span>
                            <span className="font-mono font-bold text-theme-primary">
                              #{lookupResult.relatedOrderId?.slice(-8).toUpperCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-theme-primary block">
                              ₹{lookupResult.relatedOrderDetails.totalAmount}
                            </span>
                            <span className="text-[10px] text-theme-muted uppercase font-bold">
                              {lookupResult.relatedOrderDetails.status}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
