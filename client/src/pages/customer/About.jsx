import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  Code2,
  ExternalLink,
  Cpu,
  Layers,
  HeartHandshake,
  CheckCircle2,
} from 'lucide-react';
import TestimonialsCarousel from '../../components/TestimonialsCarousel';

const sectionAnimation = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.45, ease: 'easeOut' },
  style: { willChange: 'transform, opacity' },
};

const About = () => {
  return (
    <div className="bg-theme-bg text-theme-primary overflow-x-hidden font-sans transition-colors duration-200">
      {/* ── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative bg-theme-hero text-theme-hero py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-theme">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full blur-3xl pointer-events-none floating-blob-1" />
        <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 rounded-full blur-3xl pointer-events-none floating-blob-2" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-theme-accent border border-white/15 text-xs font-bold font-poppins uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our Origin &amp; Vision</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight font-poppins text-theme-hero">
            Rethinking Doorstep Fabric Care,{' '}
            <span className="text-theme-accent">From The Ground Up.</span>
          </h1>

          <p className="text-theme-hero-muted text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Traditional laundry and dry cleaning services have stayed practically unchanged for decades — paper tags, unpredictable delivery dates, opaque pricing, and drivers wandering without optimized routes. LaundryConnect was built to fix every one of those pain points with precision engineering.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/schedule"
              className="inline-flex items-center space-x-2 font-bold px-7 py-3.5 rounded-2xl shadow-theme-accent transition-all duration-200 theme-btn-hover"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              <span>Book a Pickup</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-7 py-3.5 rounded-2xl backdrop-blur-md transition-all duration-200 theme-btn-hover"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. THE PROBLEM & OUR MISSION ────────────────────────────────────── */}
      <motion.section {...sectionAnimation} className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto will-change-transform transform-gpu">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-theme-accent-light px-3 py-1 rounded-full text-theme-accent border border-theme-accent text-xs font-bold font-poppins uppercase tracking-wider">
              <span>Why We Started</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-poppins text-theme-primary leading-tight">
              Solving the Everyday Friction of{' '}
              <span className="text-theme-accent">Laundry Day</span>
            </h2>
            <p className="text-theme-muted text-sm sm:text-base leading-relaxed">
              Anyone who has dropped clothes off at a neighborhood dry cleaner knows the drill: a scribbled paper slip, an uncertain "come back in four or five days", and zero idea whether your silk shirt or business suit is even being cleaned yet.
            </p>
            <p className="text-theme-muted text-sm sm:text-base leading-relaxed">
              We asked a simple question: <strong className="text-theme-primary">why shouldn't fabric care feel as seamless and transparent as modern parcel delivery or on-demand rides?</strong>
            </p>
            <p className="text-theme-muted text-sm sm:text-base leading-relaxed">
              LaundryConnect bridges physical garment care with rigorous software architecture. By coupling a centralized, high-standard washing and dry cleaning hub with conflict-free slot scheduling, algorithmic route optimization for delivery partners, and live WebSocket telemetry for customers, we give you your weekends back.
            </p>
          </div>

          {/* Key Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Clock,
                title: 'Guaranteed Turnarounds',
                desc: 'Standard 48-72 hours or 24-hour Express priority with min-heap deadline processing.',
                accent: 'text-amber-500',
              },
              {
                icon: MapPin,
                title: 'Live Stepper & GPS Map',
                desc: 'Watch garments transition through 6 live stages with live delivery vehicle tracking.',
                accent: 'text-blue-500',
              },
              {
                icon: Zap,
                title: 'Transparent Pricing',
                desc: 'Base ₹20 covers 3km, ₹8/km beyond, and 100% FREE delivery on orders over ₹349.',
                accent: 'text-emerald-500',
              },
              {
                icon: ShieldCheck,
                title: 'Certified Fabric Care',
                desc: 'Eco-safe detergents, Woolmark-certified steam presses, and itemized PDF tax invoices.',
                accent: 'text-purple-500',
              },
            ].map((col, idx) => (
              <div
                key={idx}
                className="bg-theme-card p-6 rounded-3xl border border-theme shadow-theme-sm theme-card-hover flex flex-col justify-between"
              >
                <div className="bg-theme-elevated w-12 h-12 rounded-2xl flex items-center justify-center border border-theme mb-4">
                  <col.icon className={`h-6 w-6 ${col.accent}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-theme-primary font-poppins mb-1.5">{col.title}</h3>
                  <p className="text-xs sm:text-sm text-theme-muted leading-relaxed">{col.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── 3. HOW IT WORKS ─────────────────────────────────────────────────── */}
      <motion.section {...sectionAnimation} className="py-20 bg-theme-secondary border-y border-theme px-4 sm:px-6 lg:px-8 will-change-transform transform-gpu">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-theme-accent-light px-3.5 py-1.5 rounded-full text-theme-accent border border-theme-accent text-xs font-bold font-poppins uppercase tracking-wider mb-4">
            <Layers className="h-3.5 w-3.5" />
            <span>The LaundryConnect Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-theme-primary font-poppins tracking-tight">
            How It <span className="text-theme-accent">Works</span>
          </h2>
          <p className="mt-2 text-theme-muted max-w-lg mx-auto text-sm sm:text-base">
            From your laundry basket back to your wardrobe in four seamless, transparent steps.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-14 text-left">
            {[
              {
                step: '01',
                title: 'Schedule in Seconds',
                desc: 'Select services (Wash & Fold, Dry Clean, Steam Ironing), choose your date and slot, and confirm via instant Razorpay payment.',
                icon: Calendar,
                badge: 'Conflict-Free Slots',
              },
              {
                step: '02',
                title: 'Doorstep Pickup',
                desc: 'Our route-optimized delivery partner arrives at your address with clean bags to collect and tag your items securely.',
                icon: Clock,
                badge: 'Dijkstra Dispatch',
              },
              {
                step: '03',
                title: 'Precision Washing',
                desc: 'Garments undergo fabric-safe washing, specialized stain removal, and gentle steam pressing at our central Jalandhar facility.',
                icon: Sparkles,
                badge: 'Eco-Safe Certified',
              },
              {
                step: '04',
                title: 'Crisp Delivery',
                desc: 'Clean, folded, and inspection-cleared garments are returned to your door. Track your delivery vehicle live on the interactive map.',
                icon: ArrowRight,
                badge: 'Live Map Stepper',
              },
            ].map((stepItem) => (
              <div
                key={stepItem.step}
                className="bg-theme-card p-6 sm:p-7 rounded-3xl border border-theme theme-card-hover shadow-theme-sm relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-theme-elevated p-3 rounded-2xl flex items-center justify-center text-theme-primary group-hover:bg-theme-accent group-hover:text-white transition-colors duration-300 border border-theme">
                      <stepItem.icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl sm:text-4xl font-black text-theme-elevated group-hover:text-theme-accent transition-colors font-mono opacity-60">
                      {stepItem.step}
                    </span>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-theme-accent bg-theme-accent-light border border-theme-accent px-2 py-0.5 rounded inline-block mb-3">
                    {stepItem.badge}
                  </span>

                  <h3 className="text-lg font-bold text-theme-primary font-poppins mb-2">{stepItem.title}</h3>
                  <p className="text-xs sm:text-sm text-theme-muted leading-relaxed">{stepItem.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── 4. FOUNDER & DEVELOPER SECTION ───────────────────────────────────── */}
      <motion.section {...sectionAnimation} className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto will-change-transform transform-gpu">
        <div className="bg-theme-card border border-theme rounded-3xl p-8 sm:p-12 shadow-theme-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-theme-accent/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8 sm:gap-10">
            {/* Avatar / Profile Graphic */}
            <div className="shrink-0 flex flex-col items-center text-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-theme-elevated border-2 border-theme-accent p-1 shadow-theme-sm flex items-center justify-center relative group overflow-hidden">
                <div className="w-full h-full rounded-2xl bg-gradient-to-tr from-amber-500/20 via-theme-elevated to-blue-500/20 flex items-center justify-center text-theme-accent">
                  <Code2 className="w-12 h-12 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <span className="mt-3 text-[11px] font-bold text-theme-accent uppercase tracking-widest bg-theme-accent-light border border-theme-accent px-2.5 py-0.5 rounded-full">
                Solo-Built
              </span>
            </div>

            {/* Founder Story Copy */}
            <div className="space-y-4 text-left">
              <div>
                <span className="text-xs font-bold text-theme-muted uppercase tracking-wider">Meet the Creator</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-theme-primary font-poppins">
                  Aniket Singh Rajput
                </h3>
                <p className="text-sm font-semibold text-theme-accent">
                  Founder &amp; Full-Stack Software Engineer
                </p>
              </div>

              <p className="text-sm sm:text-base text-theme-muted leading-relaxed">
                LaundryConnect was architected and built from scratch by Aniket Singh Rajput as an end-to-end engineered software solution to a very real logistics challenge. Rather than stitching together off-the-shelf plugins, every single component — from the conflict-free interval scheduler and Dijkstra shortest-path route optimizer to the real-time WebSocket coordinate broadcaster, AI chatbot guardrails, and Razorpay payment pipeline — was designed with clean, intentional full-stack engineering.
              </p>

              <p className="text-sm sm:text-base text-theme-muted leading-relaxed">
                The objective has always been clear: build a platform that feels responsive, reliable, and deeply polished on every screen, while providing genuine business visibility across customers, delivery partners, and facility managers alike.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href="https://www.linkedin.com/in/aniket-singh-as/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-xs font-bold bg-theme-elevated hover:bg-theme-accent hover:text-white px-4 py-2.5 rounded-xl border border-theme text-theme-primary transition-all duration-200 theme-btn-hover"
                >
                  <span>Connect on LinkedIn</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="https://github.com/imaniketrajput"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-xs font-bold bg-theme-elevated hover:bg-theme-accent hover:text-white px-4 py-2.5 rounded-xl border border-theme text-theme-primary transition-all duration-200 theme-btn-hover"
                >
                  <span>GitHub Profile</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href="mailto:as.thakuraniket@gmail.com"
                  className="inline-flex items-center space-x-2 text-xs font-bold bg-theme-elevated hover:bg-theme-accent hover:text-white px-4 py-2.5 rounded-xl border border-theme text-theme-primary transition-all duration-200 theme-btn-hover"
                >
                  <span>as.thakuraniket@gmail.com</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 5. TESTIMONIALS CAROUSEL ────────────────────────────────────────── */}
      <motion.div {...sectionAnimation} className="will-change-transform transform-gpu">
        <TestimonialsCarousel
          title="Loved by Busy People &amp; Garment Lovers"
          subtitle="See how our algorithmic scheduling and dedicated fabric care make life simpler."
        />
      </motion.div>

      {/* ── 6. READY TO EXPERIENCE CTA ──────────────────────────────────────── */}
      <motion.section {...sectionAnimation} className="bg-theme-hero text-theme-hero py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden border-t border-theme will-change-transform transform-gpu">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold font-poppins leading-tight text-theme-hero">
            Say Goodbye to <span className="text-theme-accent">Laundry Hassle.</span>
          </h2>
          <p className="text-theme-hero-muted text-sm sm:text-base max-w-lg mx-auto">
            Book your pickup in under two minutes. We'll handle the sorting, washing, pressing, and doorstep delivery.
          </p>
          <div className="pt-2">
            <Link
              to="/schedule"
              className="inline-flex items-center space-x-2 font-bold px-8 py-4 rounded-2xl shadow-theme-accent transition-all duration-200 theme-btn-hover"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              <span>Schedule Your First Pickup</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default About;
