import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { useTheme } from '../../context/ThemeContext';
import { 
  Calendar, Clock, MapPin, Zap, 
  Smile, ShieldCheck, CreditCard, ArrowRight, 
  Award, Store
} from 'lucide-react';

// ─── Shared service-icon lookup (local assets only) ─────────────────────────
const getServiceIcon = (name = '', category = '') => {
  const term = (name + ' ' + category).toLowerCase();
  if (term.includes('dry') || term.includes('iron') || term.includes('press')) {
    return '/icon-iron.png';
  }
  if (term.includes('shoe') || term.includes('curtain') || term.includes('carpet')) {
    return '/icon-laundry-basket.png';
  }
  return '/icon-washing-machine.png';
};

const FALLBACK_SERVICES = [
  { name: 'Wash & Fold',    pricePerUnit: 79,  unit: 'kg',   category: 'Laundry',      description: 'Fresh, clean, folded everyday garments.' },
  { name: 'Dry Cleaning',   pricePerUnit: 249, unit: 'pc',   category: 'Dry Cleaning', description: 'Premium care for suits, gowns, and delicates.' },
  { name: 'Iron & Press',   pricePerUnit: 29,  unit: 'pc',   category: 'Pressing',     description: 'Wrinkle-free perfection keeping you sharp.' },
  { name: 'Shoe Cleaning',  pricePerUnit: 199, unit: 'pair', category: 'Shoes',        description: 'Deep cleaning, sanitization, and deodorizing.' }
];

const sectionAnimation = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.5, ease: 'easeOut' },
  style: { willChange: 'transform, opacity' },
};

const Home = () => {
  const { theme } = useTheme();
  const [services, setServices] = useState([]);

  const heroImageSrc =
    theme === 'aurora'
      ? '/hero-delivery-aurora.webp'
      : theme === 'sunrise'
        ? '/hero-delivery-sunrise.webp'
        : '/hero-delivery.webp';

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services');
        setServices(res.data.slice(0, 4));
      } catch {
        setServices(FALLBACK_SERVICES);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="bg-theme-bg text-theme-primary overflow-x-hidden font-sans transition-colors duration-200">

      {/* ── 1. HERO WITH AMBIENT FLOATING BLOBS ─────────────────────────────── */}
      <section className="relative bg-theme-hero text-theme-hero py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[600px] flex items-center border-b border-theme">
        {/* Subtle animated floating blobs (pure CSS) */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full blur-3xl pointer-events-none floating-blob-1" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 rounded-full blur-3xl pointer-events-none floating-blob-2" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left — copy */}
          <div className="space-y-8 text-left">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-theme-accent border border-white/15 text-xs font-bold font-poppins uppercase tracking-wider shadow-sm">
              <img src="/icon-sparkle.png" alt="" className="w-4 h-4 object-contain" />
              <span>Smart Laundry Care</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight font-poppins text-theme-hero">
              Smart Laundry Pickup <br className="hidden sm:inline" />
              &amp; Delivery, <span className="text-theme-accent">Made Simple</span>
            </h1>

            <p className="text-theme-hero-muted text-base sm:text-lg leading-relaxed max-w-xl">
              Experience modern, premium fabric care with LaundryConnect. We collect your
              garments, clean them using eco-safe products, and return them fresh to your door.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                to="/schedule"
                className="flex items-center justify-center space-x-2 font-bold px-8 py-4 rounded-2xl shadow-theme-accent transition-all duration-200 theme-btn-hover"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text)',
                }}
              >
                <span>Schedule Pickup</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/services"
                className="flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl backdrop-blur-md transition-all duration-200 theme-btn-hover"
              >
                Browse Services
              </Link>
            </div>

            {/* Trust row */}
            <div className="border-t border-white/15 pt-6 grid grid-cols-3 gap-4 text-xs font-semibold text-theme-hero-muted">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-theme-accent flex-shrink-0" />
                <span>Fast 24h Express</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-theme-accent flex-shrink-0" />
                <span>Live Order Stepper</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-theme-accent flex-shrink-0" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>

          {/* Right — hero photo with theme-native frame treatment */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="hero-image-frame w-full max-w-lg">
              <img
                key={theme}
                src={heroImageSrc}
                alt="LaundryConnect delivery partner handing fresh clothes to a customer"
                className="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. HOW IT WORKS (Scroll Reveal) ─────────────────────────────────── */}
      <motion.section {...sectionAnimation} className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center will-change-transform transform-gpu">
        <h2 className="text-3xl font-extrabold text-theme-primary font-poppins tracking-tight">
          How It <span className="text-theme-accent">Works</span>
        </h2>
        <p className="mt-2 text-theme-muted max-w-md mx-auto text-sm">
          Get fresh clothes back in four easy steps without lifting a finger.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {[
            {
              step: '1', title: 'Schedule',
              desc: 'Select services and choose a convenient pickup date.',
              icon: Calendar,
              img: null,
            },
            {
              step: '2', title: 'Pickup',
              desc: 'Our partner arrives at your door to bag your items.',
              icon: Clock,
              img: null,
            },
            {
              step: '3', title: 'Clean',
              desc: 'Garments are processed using premium, certified care.',
              icon: null,
              img: '/washing-machine-illustration.png',
            },
            {
              step: '4', title: 'Deliver',
              desc: 'Fresh, folded, pristine clothes are returned to you.',
              icon: ArrowRight,
              img: null,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-theme-card p-6 rounded-3xl border border-theme theme-card-hover shadow-theme-sm relative group text-left"
            >
              <span className="absolute top-4 right-6 text-5xl font-black text-theme-elevated group-hover:text-theme-accent transition-colors opacity-60">
                0{item.step}
              </span>
              <div className="bg-theme-elevated p-3 w-14 h-14 rounded-2xl flex items-center justify-center text-theme-primary group-hover:bg-theme-accent group-hover:text-white transition-colors duration-300 mb-6 overflow-hidden border border-theme">
                {item.img ? (
                  <img src={item.img} alt={item.title} className="w-8 h-8 object-contain" />
                ) : (
                  <item.icon className="h-6 w-6" />
                )}
              </div>
              <h3 className="text-lg font-bold text-theme-primary font-poppins mb-2">{item.title}</h3>
              <p className="text-sm text-theme-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── 3. SERVICES PREVIEW (Scroll Reveal) ──────────────────────────────── */}
      <motion.section {...sectionAnimation} className="py-16 bg-theme-secondary border-y border-theme px-4 sm:px-6 lg:px-8 will-change-transform transform-gpu">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div className="text-left">
              <h2 className="text-3xl font-extrabold text-theme-primary font-poppins tracking-tight">
                Our Popular <span className="text-theme-accent">Services</span>
              </h2>
              <p className="text-theme-muted text-sm mt-1 max-w-sm">
                Professional cleaning services tailored to keep your garments pristine.
              </p>
            </div>
            <Link
              to="/services"
              className="text-sm font-bold text-theme-accent hover:opacity-80 flex items-center space-x-1.5 mt-4 md:mt-0 group"
            >
              <span>View All Services</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc, i) => (
              <div
                key={i}
                className="bg-theme-card rounded-3xl p-6 border border-theme theme-card-hover shadow-theme-sm flex flex-col group h-full"
              >
                <div className="bg-theme-elevated w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6 border border-theme p-2">
                  <img
                    src={getServiceIcon(svc.name, svc.category)}
                    alt={svc.name}
                    className="w-8 h-8 object-contain"
                  />
                </div>

                <h3 className="text-lg font-bold text-theme-primary font-poppins mb-2">{svc.name}</h3>
                <p className="text-sm text-theme-muted mb-6 flex-grow leading-relaxed">{svc.description}</p>

                <div className="flex justify-between items-center border-t border-theme pt-4 mt-auto">
                  <div>
                    <span className="text-xs text-theme-muted">Starting at</span>
                    <p className="text-xl font-black text-theme-primary">
                      ₹{svc.pricePerUnit}
                      <span className="text-xs text-theme-muted font-normal">/{svc.unit}</span>
                    </p>
                  </div>
                  <Link
                    to="/services"
                    className="bg-theme-elevated hover:bg-theme-accent hover:text-white p-2.5 rounded-xl border border-theme transition-all text-theme-primary theme-btn-hover"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── 4. ENGINEERED FOR RELIABILITY (Scroll Reveal) ────────────────────── */}
      <motion.section {...sectionAnimation} className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto will-change-transform transform-gpu">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-theme-primary font-poppins tracking-tight">
            Engineered for <span className="text-theme-accent">Reliability</span>
          </h2>
          <p className="text-theme-muted text-sm mt-2">
            We use smart optimization algorithms to guarantee seamless booking,
            route-optimized dispatching, and priority processing.
          </p>
        </div>

        {/* Two-column: feature cards + real photo */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-stretch">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Smart Scheduling & Conflict Solver',
                algo: 'Conflict-Free Slot Scheduler',
                desc: 'A conflict detection matrix scans existing bookings to guarantee zero double-bookings.',
                icon: Calendar,
              },
              {
                title: 'Heap-Based Priority Queue',
                algo: 'Priority Express System',
                desc: 'Express orders are processed via a min-heap that prioritises urgent requests by deadline score.',
                icon: Zap,
              },
              {
                title: 'Dijkstra Route Optimization',
                algo: 'Optimised Delivery System',
                desc: 'Riders get Dijkstra-calculated stop sequences, cutting idle kilometres and delivery times.',
                icon: MapPin,
              },
              {
                title: 'Live Order Stepper Tracking',
                algo: 'Timeline Sync Tracker',
                desc: 'Watch your order move through Placed → PickedUp → Washing → Ready → Delivered in real time.',
                icon: ShieldCheck,
              },
            ].map((feat, idx) => (
              <div
                key={idx}
                className="bg-theme-card p-6 rounded-3xl border border-theme theme-card-hover shadow-theme-sm flex space-x-4 text-left"
              >
                <div className="bg-theme-elevated p-3 w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border border-theme">
                  <feat.icon className="h-5 w-5 text-theme-accent" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <span className="inline-block text-[10px] font-extrabold tracking-wider text-theme-accent uppercase bg-theme-accent-light border border-theme-accent px-2 py-0.5 rounded">
                    {feat.algo}
                  </span>
                  <h3 className="text-sm font-bold text-theme-primary font-poppins pt-0.5">{feat.title}</h3>
                  <p className="text-xs text-theme-muted leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-theme shadow-theme-md min-h-[360px]">
            <img
              src="/laundry-room-realistic.png"
              alt="Professional laundry facility used by LaundryConnect"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </motion.section>

      {/* ── 5. STATS BAR (Scroll Reveal) ────────────────────────────────────── */}
      <motion.section {...sectionAnimation} className="bg-theme-elevated text-theme-primary py-12 px-4 sm:px-6 lg:px-8 border-y border-theme will-change-transform transform-gpu">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '400,000+', label: 'Happy Customers', icon: Smile },
            { value: '48+',      label: 'Cities Served',   icon: MapPin },
            { value: '100+',     label: 'Local Outlets',   icon: Store },
            { value: '1.5M+',   label: 'Clothes Delivered',icon: Award },
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-center text-theme-accent mb-1">
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black text-theme-primary font-poppins">{stat.value}</p>
              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── 6. TESTIMONIALS (Scroll Reveal) ─────────────────────────────────── */}
      <motion.section {...sectionAnimation} className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center will-change-transform transform-gpu">
        <h2 className="text-3xl font-extrabold text-theme-primary font-poppins tracking-tight">
          What Our Customers <span className="text-theme-accent">Say</span>
        </h2>
        <p className="mt-2 text-theme-muted max-w-md mx-auto text-sm">
          Hear from our community about how we transformed their weekly laundry routine.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
          {[
            {
              name: 'Himanshu Yadav',
              role: 'Delhi Customer',
              quote: 'I absolutely loved how fresh and neatly folded my clothes arrived. No harsh chemical smell, fabrics felt softer. Route-optimization ensures pickup is always on point.',
              rating: 5,
              photo: '/happy-customer-basket.png',
            },
            {
              name: 'Sneha Sharma',
              role: 'Mumbai Customer',
              quote: 'LaundryConnect is a game-changer! Express delivery has saved me before business trips. Being able to track my order stepper live keeps me stress-free.',
              rating: 5,
              photo: null,
            },
            {
              name: 'Rahul Verma',
              role: 'Bangalore Customer',
              quote: 'Superb quality. The dry cleaning is Woolmark certified, and it shows. Everything comes back brand-new, hung neatly, and smelling clean. Customer service is top-notch.',
              rating: 5,
              photo: null,
            },
          ].map((t, idx) => (
            <div
              key={idx}
              className="bg-theme-card p-8 rounded-3xl border border-theme theme-card-hover transition-all duration-300 flex flex-col justify-between shadow-theme-sm"
            >
              <div>
                <div className="flex text-theme-accent mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-lg">★</span>
                  ))}
                </div>
                <p className="text-theme-muted text-sm leading-relaxed italic mb-6">"{t.quote}"</p>
              </div>

              <div className="flex items-center space-x-3 border-t border-theme pt-4 mt-auto">
                {t.photo ? (
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-theme-accent flex-shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-theme-elevated border border-theme flex items-center justify-center font-bold text-theme-primary flex-shrink-0 text-sm">
                    {t.name[0]}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-theme-primary">{t.name}</h4>
                  <p className="text-xs text-theme-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── 7. CTA BANNER (Scroll Reveal) ───────────────────────────────────── */}
      <motion.section {...sectionAnimation} className="bg-theme-hero text-theme-hero py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden border-t border-theme will-change-transform transform-gpu">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-poppins leading-tight text-theme-hero">
            Ready to Experience <span className="text-theme-accent">Premium Fabric Care?</span>
          </h2>
          <p className="text-theme-hero-muted text-base max-w-lg mx-auto">
            Book your slot now and let our algorithm-powered pickup and delivery network handle the chore.
          </p>
          <div className="pt-4">
            <Link
              to="/schedule"
              className="inline-flex items-center space-x-2 font-bold px-8 py-4 rounded-2xl shadow-theme-accent transition-all duration-200 theme-btn-hover"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              <span>Schedule Your Pickup</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </motion.section>

    </div>
  );
};

// Internal mini-icon (SVG)
const PlusIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default Home;
