import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ShoppingBag,
  CreditCard,
  Truck,
  UserCheck,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const FAQ_DATA = [
  // ─── 1. ORDERS ─────────────────────────────────────────────────────────────
  {
    id: 'ord-1',
    category: 'Orders',
    question: 'How do I place an order on LaundryConnect?',
    answer:
      'Placing an order takes under 2 minutes: select your services and item quantities on the Services or Schedule Pickup page, choose a preferred pickup date and convenient time slot, select or enter your verified doorstep address, and complete payment upfront via Razorpay checkout. Once confirmed, your order immediately enters our priority processing queue.',
  },
  {
    id: 'ord-2',
    category: 'Orders',
    question: 'What are the 6 garment stages of an order?',
    answer:
      'Your garments progress transparently through 6 distinct stages: 1) Placed (payment verified and pickup scheduled), 2) PickedUp (delivery partner collected garments at your doorstep), 3) Washing (in treatment, washing, or dry cleaning at our central hub), 4) Ready (pressed, inspected, and packaged), 5) OutForDelivery (partner in transit with fresh garments), and 6) Delivered (order completed at your door, triggering rating feedback). You can track this in real time on the Track Order page.',
  },
  {
    id: 'ord-3',
    category: 'Orders',
    question: 'What is the turnaround time for standard vs. express laundry?',
    answer:
      'Our Standard Turnaround is 48 to 72 hours from doorstep pickup to delivery. Need your garments urgently? Select our 24-Hour Express Turnaround during scheduling for an optional ₹150 fee. Express orders receive highest priority queue placement (processed via a min-heap algorithm) for guaranteed 24-hour return from collection to doorstep delivery.',
  },
  {
    id: 'ord-4',
    category: 'Orders',
    question: 'Why do I pay before the order is confirmed?',
    answer:
      'LaundryConnect operates a payment-first flow to guarantee slot reservation and priority dispatch. When you configure your laundry, a draft order is created. Once payment is verified via Razorpay, the order officially activates, locks your delivery slot, and dispatches your order to our rider network.',
  },
  {
    id: 'ord-5',
    category: 'Orders',
    question: 'Can I cancel or reschedule an order?',
    answer:
      'Orders can be cancelled or rescheduled prior to driver pickup directly from your My Orders page or by contacting support. Once a driver has physically collected your garments, cancellation is no longer possible as washing and sanitization immediately commence at our facility.',
  },

  // ─── 2. PAYMENTS ───────────────────────────────────────────────────────────
  {
    id: 'pay-1',
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major online payment methods powered by Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), Debit & Credit Cards (Visa, MasterCard, RuPay), and Net Banking across 50+ Indian banks. Cash on Delivery (COD) is also available in select supported pin codes.',
  },
  {
    id: 'pay-2',
    category: 'Payments',
    question: 'How do I download my official tax invoice?',
    answer:
      'Every paid order generates an official itemized PDF tax invoice detailing service breakdowns, delivery charges, express fees, and taxes. You can download or print your PDF invoice at any time from your My Orders dashboard, and a copy is also automatically attached to your payment confirmation email.',
  },
  {
    id: 'pay-3',
    category: 'Payments',
    question: 'Is online payment secure on LaundryConnect?',
    answer:
      'Yes, 100%. All online payments are handled directly by Razorpay with bank-grade 256-bit SSL encryption and full PCI-DSS Level 1 compliance. LaundryConnect never stores or processes raw credit/debit card numbers or bank credentials on our servers.',
  },
  {
    id: 'pay-4',
    category: 'Payments',
    question: 'What happens if my payment fails during checkout?',
    answer:
      'If your payment fails or you accidentally dismiss the payment window, your selected items and date slot remain saved as a draft. You can simply click "Retry Payment" on the confirmation screen or in My Orders without re-entering your items.',
  },

  // ─── 3. DELIVERY ───────────────────────────────────────────────────────────
  {
    id: 'del-1',
    category: 'Delivery',
    question: 'How is the delivery charge calculated?',
    answer:
      'Our delivery fee is calculated using an authoritative spherical distance formula from our Central Laundry Facility Hub in Jalandhar (Lat: 31.3260, Lng: 75.5762): Base delivery charge of ₹20 covers the first 3 km, plus ₹8 per additional km beyond 3 km (rounded up to the nearest whole km). Best of all: Delivery is 100% FREE whenever your items subtotal exceeds ₹349!',
  },
  {
    id: 'del-2',
    category: 'Delivery',
    question: 'How does live delivery partner map tracking work?',
    answer:
      'When your order is in active pickup or delivery transit, an interactive Leaflet map appears on your Track Order page displaying the delivery partner’s live vehicle coordinates and travel heading. A live freshness badge (e.g. "Live • Updated just now") indicates active sync.',
  },
  {
    id: 'del-3',
    category: 'Delivery',
    question: 'Do you deliver to addresses farther than 25 km?',
    answer:
      'Yes! We do not arbitrarily reject customers based on strict geofences. Addresses further than 25 km from the central hub are serviceable; an informational notice will appear during scheduling noting that delivery turnaround may take slightly longer due to regional transit distance.',
  },
  {
    id: 'del-4',
    category: 'Delivery',
    question: 'Can I coordinate directly with my assigned delivery partner?',
    answer:
      'Yes. When a delivery partner is assigned to your active order, an order-scoped Live Chat panel opens on your Track Order page. You can send real-time directions ("I\'m at Gate 3", "Please ring doorbell") directly to the driver with zero lag.',
  },

  // ─── 4. ACCOUNT ────────────────────────────────────────────────────────────
  {
    id: 'acc-1',
    category: 'Account',
    question: 'What is the GDPR-compliant Account Deletion Policy?',
    answer:
      'We respect your privacy and right to be forgotten. In your Profile settings, you can initiate self-serve account deletion by typing "DELETE". Your personal profile information (name, phone, saved addresses, avatars) is permanently scrubbed and anonymized, while historical financial and order invoices are preserved in compliance with statutory Indian accounting laws.',
  },
  {
    id: 'acc-2',
    category: 'Account',
    question: 'How does the Saved Address Book work?',
    answer:
      'You can save multiple labeled addresses (Home, Work, Other) in your profile with verified GPS coordinates captured via Nominatim autocomplete. During checkout, you can select any saved address with a single click to auto-fill verified pickup coordinates without re-typing.',
  },
  {
    id: 'acc-3',
    category: 'Account',
    question: 'How do I upload or update my profile photo?',
    answer:
      'You have two convenient options on your Profile page: take a live photo using your desktop webcam / mobile camera shutter, or upload an image file from your device. All images are compressed client-side using HTML5 Canvas to ensure instant loading without quality degradation.',
  },
  {
    id: 'acc-4',
    category: 'Account',
    question: 'What is the blue "Profile Complete" checkmark badge?',
    answer:
      'A blue BadgeCheck checkmark appears next to your name across the platform when your profile is 100% complete (name, email, phone, profile photo, at least one saved address, and date of birth/gender). It reflects full profile setup for the smoothest one-click checkout experience.',
  },
];

const CATEGORIES = [
  { id: 'All', label: 'All Questions', icon: HelpCircle },
  { id: 'Orders', label: 'Orders', icon: ShoppingBag },
  { id: 'Payments', label: 'Payments', icon: CreditCard },
  { id: 'Delivery', label: 'Delivery', icon: Truck },
  { id: 'Account', label: 'Account', icon: UserCheck },
];

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const toggleAccordion = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="bg-theme-bg text-theme-primary overflow-x-hidden font-sans transition-colors duration-200">
      {/* ── 1. HERO & SEARCH SECTION ────────────────────────────────────────── */}
      <section className="relative bg-theme-hero text-theme-hero py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-theme">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full blur-3xl pointer-events-none floating-blob-1" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 rounded-full blur-3xl pointer-events-none floating-blob-2" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-theme-accent border border-white/15 text-xs font-bold font-poppins uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Help Center &amp; Ground Truth</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight font-poppins text-theme-hero">
            Frequently Asked <span className="text-theme-accent">Questions</span>
          </h1>

          <p className="text-theme-hero-muted text-base sm:text-lg leading-relaxed max-w-xl mx-auto">
            Everything you need to know about our services, pricing formulas, turnaround times, and delivery policies.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto relative mt-6">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-theme-hero-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, e.g. express fee, free delivery, invoices..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 text-sm focus:outline-none focus:border-theme-accent transition-colors shadow-theme-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-xs font-bold text-theme-hero-muted hover:text-white uppercase"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CATEGORY TABS & ACCORDION ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Category Filter Tabs */}
        <div className="flex border-b border-theme overflow-x-auto gap-2 no-scrollbar pb-3 mb-10">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = FAQ_DATA.filter(
              (item) => cat.id === 'All' || item.category === cat.id
            ).length;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setExpandedId(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'bg-theme-accent-light text-theme-accent border-theme-accent shadow-sm'
                    : 'bg-theme-card text-theme-muted hover:text-theme-primary border-theme hover:bg-theme-elevated'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-theme-accent' : 'text-theme-muted'}`} />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-theme-accent text-theme-accent-text' : 'bg-theme-elevated text-theme-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-theme-muted mb-6">
          <p>
            Showing <strong className="text-theme-primary">{filteredFaqs.length}</strong>{' '}
            {filteredFaqs.length === 1 ? 'question' : 'questions'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-theme-accent font-bold hover:underline"
            >
              Reset search
            </button>
          )}
        </div>

        {/* Accordion Questions List */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16 bg-theme-card border border-theme rounded-3xl p-8">
            <HelpCircle className="h-12 w-12 text-theme-muted mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-theme-primary font-poppins">No matching answers found</h3>
            <p className="text-sm text-theme-muted mt-1 max-w-sm mx-auto">
              We couldn't find any questions matching your search query. Try different keywords or reach out to our team.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="text-xs font-bold px-4 py-2 bg-theme-elevated hover:bg-theme-accent hover:text-white rounded-xl border border-theme text-theme-primary transition-colors"
              >
                Show All Questions
              </button>
              <Link
                to="/contact"
                className="text-xs font-bold px-4 py-2 bg-theme-accent text-theme-accent-text rounded-xl shadow-sm transition-opacity hover:opacity-90"
              >
                Contact Support
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;

              return (
                <div
                  key={faq.id}
                  className={`bg-theme-card border rounded-3xl transition-colors duration-200 overflow-hidden ${
                    isExpanded ? 'border-theme-accent shadow-theme-sm' : 'border-theme hover:border-theme-accent/50'
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full text-left p-6 flex items-start justify-between gap-4 focus:outline-none"
                    aria-expanded={isExpanded}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-theme-accent bg-theme-accent-light border border-theme-accent px-2 py-0.5 rounded inline-block">
                        {faq.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-theme-primary font-poppins leading-snug pt-1">
                        {faq.question}
                      </h3>
                    </div>

                    <div
                      className={`p-2 rounded-xl bg-theme-elevated text-theme-primary border border-theme shrink-0 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180 bg-theme-accent text-white' : ''
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {/* Expandable Accordion Body */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        style={{ willChange: 'transform, opacity' }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-2 text-sm sm:text-base text-theme-muted leading-relaxed border-t border-theme/50">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 3. STILL HAVE QUESTIONS BANNER ───────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-12">
        <div className="bg-theme-card border border-theme rounded-3xl p-8 sm:p-10 shadow-theme-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-theme-accent-light border border-theme-accent flex items-center justify-center text-theme-accent shrink-0">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-theme-primary font-poppins">
                Still have questions or need assistance?
              </h3>
              <p className="text-xs sm:text-sm text-theme-muted mt-1">
                Our support team and AI assistant are available 24/7 to resolve any inquiry.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/contact"
              className="inline-flex items-center space-x-2 text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl shadow-theme-accent transition-all duration-200 theme-btn-hover"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              <span>Submit a Ticket</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
