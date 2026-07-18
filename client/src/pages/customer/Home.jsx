import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { 
  Sparkles, Calendar, Clock, MapPin, Zap, 
  Smile, ShieldCheck, CreditCard, ArrowRight, 
  Award, Store
} from 'lucide-react';

// ─── Shared service-icon lookup (no emoji, local assets only) ──────────────
const getServiceIcon = (name = '', category = '') => {
  const term = (name + ' ' + category).toLowerCase();
  if (term.includes('dry') || term.includes('iron') || term.includes('press')) {
    return '/icon-iron.png';
  }
  if (term.includes('shoe') || term.includes('curtain') || term.includes('carpet')) {
    return '/icon-laundry-basket.png';
  }
  // default: washing machine
  return '/icon-washing-machine.png';
};

const FALLBACK_SERVICES = [
  { name: 'Wash & Fold',    pricePerUnit: 79,  unit: 'kg',   category: 'Laundry',      description: 'Fresh, clean, folded everyday garments.' },
  { name: 'Dry Cleaning',   pricePerUnit: 249, unit: 'pc',   category: 'Dry Cleaning', description: 'Premium care for suits, gowns, and delicates.' },
  { name: 'Iron & Press',   pricePerUnit: 29,  unit: 'pc',   category: 'Pressing',     description: 'Wrinkle-free perfection keeping you sharp.' },
  { name: 'Shoe Cleaning',  pricePerUnit: 199, unit: 'pair', category: 'Shoes',        description: 'Deep cleaning, sanitization, and deodorizing.' }
];

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services');
        setServices(res.data.slice(0, 4));
      } catch {
        setServices(FALLBACK_SERVICES);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="bg-navy-50 overflow-x-hidden font-sans">

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[600px] flex items-center">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-navy-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div className="space-y-8 relative z-10 text-left">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-gold-400 border border-white/10 text-xs font-bold font-poppins uppercase tracking-wider">
              <img src="/icon-sparkle.png" alt="" className="w-4 h-4 object-contain" />
              <span>Smart Laundry Care</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none font-poppins">
              Smart Laundry Pickup <br className="hidden sm:inline" />
              &amp; Delivery, <span className="text-gold-500">Made Simple</span>
            </h1>

            <p className="text-navy-200 text-base sm:text-lg leading-relaxed max-w-xl">
              Experience modern, premium fabric care with LaundryConnect. We collect your
              garments, clean them using eco-safe products, and return them fresh to your door.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                to="/schedule"
                className="flex items-center justify-center space-x-2 bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold px-8 py-4 rounded-2xl shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <span>Schedule Pickup</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/services"
                className="flex items-center justify-center bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 font-bold px-8 py-4 rounded-2xl transition-all duration-200"
              >
                Browse Services
              </Link>
            </div>

            {/* Trust row — lucide icons (not emoji) */}
            <div className="border-t border-white/10 pt-6 grid grid-cols-3 gap-4 text-xs font-semibold text-navy-200">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gold-500 flex-shrink-0" />
                <span>Fast 24h Express</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-gold-500 flex-shrink-0" />
                <span>Live Order Tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-gold-500 flex-shrink-0" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>

          {/* Right — hero photo (local asset) */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              {/* Gold border accent */}
              <div className="absolute inset-0 border-2 border-gold-500/30 rounded-3xl translate-x-4 translate-y-4 -z-10" />
              <img
                src="/hero-delivery.webp"
                alt="LaundryConnect delivery partner handing fresh clothes to a customer"
                className="w-full h-auto object-cover rounded-3xl shadow-2xl relative z-10 border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-navy-900 font-poppins tracking-tight">
          How It <span className="text-gold-600">Works</span>
        </h2>
        <p className="mt-2 text-navy-500 max-w-md mx-auto text-sm">
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
              className="bg-white p-6 rounded-3xl border border-navy-100 hover:border-gold-300 hover:shadow-lg transition-all duration-300 relative group"
            >
              <span className="absolute top-4 right-6 text-5xl font-black text-navy-50 group-hover:text-gold-50 transition-colors">
                0{item.step}
              </span>
              <div className="bg-navy-50 p-3 w-14 h-14 rounded-2xl flex items-center justify-center text-navy-900 group-hover:bg-navy-900 group-hover:text-gold-500 transition-colors duration-300 mb-6 overflow-hidden">
                {item.img ? (
                  <img src={item.img} alt={item.title} className="w-8 h-8 object-contain" />
                ) : (
                  <item.icon className="h-6 w-6" />
                )}
              </div>
              <h3 className="text-lg font-bold text-navy-900 font-poppins text-left mb-2">{item.title}</h3>
              <p className="text-sm text-navy-500 text-left leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. SERVICES PREVIEW ─────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-y border-navy-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div className="text-left">
              <h2 className="text-3xl font-extrabold text-navy-900 font-poppins tracking-tight">
                Our Popular <span className="text-gold-600">Services</span>
              </h2>
              <p className="text-navy-500 text-sm mt-1 max-w-sm">
                Professional cleaning services tailored to keep your garments pristine.
              </p>
            </div>
            <Link
              to="/services"
              className="text-sm font-bold text-gold-600 hover:text-gold-700 flex items-center space-x-1.5 mt-4 md:mt-0 group"
            >
              <span>View All Services</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((svc, i) => (
              <div
                key={i}
                className="bg-navy-50/50 hover:bg-white rounded-3xl p-6 border border-navy-100 hover:border-gold-300 hover:shadow-xl transition-all duration-300 flex flex-col group h-full"
              >
                {/* ── Service icon: real image, no emoji ── */}
                <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm mb-6 border border-navy-100 p-2">
                  <img
                    src={getServiceIcon(svc.name, svc.category)}
                    alt={svc.name}
                    className="w-8 h-8 object-contain"
                  />
                </div>

                <h3 className="text-lg font-bold text-navy-900 font-poppins mb-2">{svc.name}</h3>
                <p className="text-sm text-navy-500 mb-6 flex-grow leading-relaxed">{svc.description}</p>

                <div className="flex justify-between items-center border-t border-navy-100 pt-4 mt-auto">
                  <div>
                    <span className="text-xs text-navy-500">Starting at</span>
                    <p className="text-xl font-black text-navy-900">
                      ₹{svc.pricePerUnit}
                      <span className="text-xs text-navy-400 font-normal">/{svc.unit}</span>
                    </p>
                  </div>
                  <Link
                    to="/services"
                    className="bg-white hover:bg-navy-900 hover:text-gold-500 p-2.5 rounded-xl border border-navy-200 transition-all text-navy-700"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. ENGINEERED FOR RELIABILITY ───────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-navy-900 font-poppins tracking-tight">
            Engineered for <span className="text-gold-600">Reliability</span>
          </h2>
          <p className="text-navy-500 text-sm mt-2">
            We use smart optimization algorithms to guarantee seamless booking,
            route-optimized dispatching, and priority processing.
          </p>
        </div>

        {/* Two-column: feature cards + real laundry room photo */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-stretch">
          {/* Feature cards — 3 columns wide */}
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
                className="bg-white p-6 rounded-3xl border border-navy-100 hover:border-gold-300 shadow-sm hover:shadow-lg transition-all duration-300 flex space-x-4 text-left"
              >
                <div className="bg-navy-50 p-3 w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center">
                  <feat.icon className="h-5 w-5 text-gold-600" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold tracking-wider text-gold-600 uppercase bg-gold-50 border border-gold-100 px-2 py-0.5 rounded">
                    {feat.algo}
                  </span>
                  <h3 className="text-sm font-bold text-navy-900 font-poppins pt-0.5">{feat.title}</h3>
                  <p className="text-xs text-navy-500 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Real photo — 2 columns wide */}
          <div className="lg:col-span-2 rounded-3xl overflow-hidden border border-navy-100 shadow-lg min-h-[360px]">
            <img
              src="/laundry-room-realistic.png"
              alt="Professional laundry facility used by LaundryConnect"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── 5. STATS BAR ────────────────────────────────────────────────────── */}
      <section className="bg-navy-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-y border-navy-950">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '400,000+', label: 'Happy Customers', icon: Smile },
            { value: '48+',      label: 'Cities Served',   icon: MapPin },
            { value: '100+',     label: 'Local Outlets',   icon: Store },
            { value: '1.5M+',   label: 'Clothes Delivered',icon: Award },
          ].map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-center text-gold-500 mb-1">
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-3xl font-black text-white font-poppins">{stat.value}</p>
              <p className="text-xs font-bold text-navy-300 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold text-navy-900 font-poppins tracking-tight">
          What Our Customers <span className="text-gold-600">Say</span>
        </h2>
        <p className="mt-2 text-navy-500 max-w-md mx-auto text-sm">
          Hear from our community about how we transformed their weekly laundry routine.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
          {[
            {
              name: 'Himanshu Yadav',
              role: 'Delhi Customer',
              quote: 'I absolutely loved how fresh and neatly folded my clothes arrived. No harsh chemical smell, fabrics felt softer. Route-optimization ensures pickup is always on point.',
              rating: 5,
              photo: '/happy-customer-basket.png',  // real photo for first card
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
              className="bg-white p-8 rounded-3xl border border-navy-100 hover:border-gold-300 transition-all duration-300 flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex text-gold-500 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-lg">★</span>
                  ))}
                </div>
                <p className="text-navy-600 text-sm leading-relaxed italic mb-6">"{t.quote}"</p>
              </div>

              <div className="flex items-center space-x-3 border-t border-navy-50 pt-4 mt-auto">
                {t.photo ? (
                  <img
                    src={t.photo}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-gold-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-navy-100 flex items-center justify-center font-bold text-navy-700 flex-shrink-0 text-sm">
                    {t.name[0]}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-navy-900">{t.name}</h4>
                  <p className="text-xs text-navy-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-950 text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden border-t border-navy-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-poppins leading-tight">
            Ready to Experience <span className="text-gold-500">Premium Fabric Care?</span>
          </h2>
          <p className="text-navy-300 text-base max-w-lg mx-auto">
            Book your slot now and let our algorithm-powered pickup and delivery network handle the chore.
          </p>
          <div className="pt-4">
            <Link
              to="/schedule"
              className="inline-flex items-center space-x-2 bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold px-8 py-4 rounded-2xl shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <span>Schedule Your Pickup</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

// Internal mini-icon (SVG, no emoji)
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
