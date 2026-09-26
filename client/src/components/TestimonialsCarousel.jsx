import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star, Sparkles, CheckCircle2 } from 'lucide-react';

/**
 * SAMPLE TESTIMONIAL CONTENT:
 * Clearly fictional customer quotes used for demonstration purposes
 * before live review aggregation data is collected.
 */
const SAMPLE_TESTIMONIALS = [
  {
    id: 1,
    name: 'Aarav Malhotra',
    role: 'Product Lead, Tech Start-up',
    city: 'New Delhi',
    rating: 5,
    tag: '24-Hr Express Care',
    quote:
      'I commute between Delhi and Mumbai weekly. LaundryConnect’s 24-hour express service is an absolute lifesaver. My crisp dress shirts arrived pressed, hung in eco-friendly covers, and exactly on time before my Monday investor pitch.',
    avatar: 'AM',
    avatarBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  {
    id: 2,
    name: 'Priyanka Sen',
    role: 'Architect & Urban Designer',
    city: 'Jalandhar',
    rating: 5,
    tag: 'Woolmark & Delicate Care',
    quote:
      'I was hesitant about entrusting hand-embroidered silks and winter woolens to any delivery service. LaundryConnect treated each garment with museum-grade precision — no fabric stress, zero harsh solvent scent, and impeccable folding.',
    avatar: 'PS',
    avatarBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    id: 3,
    name: 'Vikramaditya Iyer',
    role: 'Senior Consultant & Frequent Traveler',
    city: 'Bengaluru',
    rating: 5,
    tag: 'Live Vehicle Map Tracking',
    quote:
      'The live GPS tracking on the order stepper is the standout differentiator. Seeing the delivery partner route in real time eliminates the "waiting by the door" friction that every traditional dry cleaner inflicts. Flawless engineering.',
    avatar: 'VI',
    avatarBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 4,
    name: 'Neha Chawla',
    role: 'Independent Cafe Owner',
    city: 'Chandigarh',
    rating: 5,
    tag: 'Bulk Apron & Linen Laundry',
    quote:
      'Running a cafe means heavy stains on aprons and table linens daily. The stain treatment and steam pressing are phenomenal. The automated tax invoice download keeps my monthly accounting effortless.',
    avatar: 'NC',
    avatarBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  {
    id: 5,
    name: 'Rohan Mehra',
    role: 'Graduate Student & Marathoner',
    city: 'Amritsar',
    rating: 5,
    tag: 'Activewear & Sneaker Restoration',
    quote:
      'The shoe cleaning service resurrected a pair of mud-caked trail runners that I thought were ready for the bin. Soles sanitized, insoles deodorized, laces crisp. The pricing is genuinely transparent with free delivery over ₹349.',
    avatar: 'RM',
    avatarBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
];

const TestimonialsCarousel = ({ title = 'What Our Customers Say', subtitle = 'Real feedback from people who transformed their laundry routine.' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % SAMPLE_TESTIMONIALS.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + SAMPLE_TESTIMONIALS.length) % SAMPLE_TESTIMONIALS.length);
  };

  // Auto-rotation timer: 6 seconds interval, pauses on hover
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, 6000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, currentIndex]);

  const current = SAMPLE_TESTIMONIALS[currentIndex];

  const slideVariants = {
    enter: (dir) => ({
      opacity: 0,
      x: dir > 0 ? 40 : -40,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (dir) => ({
      opacity: 0,
      x: dir > 0 ? -40 : 40,
    }),
  };

  return (
    <section 
      className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center space-x-2 bg-theme-accent-light px-3.5 py-1.5 rounded-full text-theme-accent border border-theme-accent text-xs font-bold font-poppins uppercase tracking-wider mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Customer Stories</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-theme-primary font-poppins tracking-tight">
          {title}
        </h2>
        <p className="mt-3 text-theme-muted text-sm sm:text-base leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Main Carousel Card Container */}
      <div className="relative max-w-4xl mx-auto">
        <div className="relative bg-theme-card border border-theme rounded-3xl p-6 sm:p-10 shadow-theme-md overflow-hidden min-h-[340px] flex flex-col justify-between">
          {/* Subtle background ambient quote glyph */}
          <Quote className="absolute -top-6 -right-6 h-36 w-36 text-theme-elevated/40 pointer-events-none rotate-12" />

          {/* Animated Slide Content */}
          <div className="relative z-10">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={current.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ willChange: 'transform, opacity' }}
                className="transform-gpu flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Rating Stars & Category Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${
                            i < current.rating ? 'fill-amber-400 text-amber-400' : 'text-theme-muted'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-theme-muted ml-2">
                        {current.rating}.0 / 5.0
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-theme-accent bg-theme-accent-light border border-theme-accent px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="h-3 w-3" />
                      {current.tag}
                    </span>
                  </div>

                  {/* Customer Quote */}
                  <blockquote className="text-theme-primary text-base sm:text-xl font-normal leading-relaxed italic mb-8">
                    "{current.quote}"
                  </blockquote>
                </div>

                {/* Submitter Author Info */}
                <div className="border-t border-theme pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base border ${current.avatarBg} shrink-0 font-poppins`}
                    >
                      {current.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-theme-primary text-base font-poppins leading-tight">
                        {current.name}
                      </h4>
                      <p className="text-xs text-theme-muted mt-0.5">
                        {current.role} &bull; <span className="text-theme-accent">{current.city}</span>
                      </p>
                    </div>
                  </div>

                  {/* Manual Prev / Next Controls */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={prevSlide}
                      className="p-2.5 rounded-xl bg-theme-elevated hover:bg-theme-accent hover:text-white border border-theme text-theme-primary transition-all duration-200 theme-btn-hover"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="p-2.5 rounded-xl bg-theme-elevated hover:bg-theme-accent hover:text-white border border-theme text-theme-primary transition-all duration-200 theme-btn-hover"
                      aria-label="Next testimonial"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="flex justify-center items-center space-x-2 mt-6">
          {SAMPLE_TESTIMONIALS.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`transition-all duration-300 rounded-full ${
                currentIndex === idx
                  ? 'w-8 h-2.5 bg-theme-accent'
                  : 'w-2.5 h-2.5 bg-theme-elevated hover:bg-theme-muted border border-theme'
              }`}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
