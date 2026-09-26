import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle2, AlertTriangle, ShieldCheck, CreditCard, RefreshCw, Scale } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="bg-theme-bg text-theme-primary overflow-x-hidden font-sans transition-colors duration-200">
      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <section className="relative bg-theme-hero text-theme-hero py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-theme">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-theme-accent border border-white/15 text-xs font-bold font-poppins uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            <span>Platform Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-poppins text-theme-hero tracking-tight">
            Terms of <span className="text-theme-accent">Service</span>
          </h1>
          <p className="text-theme-hero-muted text-sm sm:text-base max-w-xl mx-auto">
            Last updated: September 2026 &bull; The operational terms, turnaround guidelines, and liability boundaries of LaundryConnect.
          </p>
        </div>
      </section>

      {/* ── 2. TERMS CONTENT ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
        {/* Intro */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 shadow-theme-sm space-y-4 leading-relaxed text-sm sm:text-base text-theme-muted">
          <p>
            Welcome to <strong className="text-theme-primary">LaundryConnect</strong>. By accessing our web application, scheduling a doorstep laundry pickup, or using our delivery coordination services, you agree to be bound by these Terms of Service.
          </p>
          <p>
            Please read them carefully. If you do not agree with any part of these terms, you should discontinue using LaundryConnect immediately.
          </p>
        </div>

        {/* 1. Services & Orders */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-theme-elevated text-theme-accent border border-theme">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-theme-primary">
              1. Services &amp; Ordering Policy
            </h2>
          </div>
          <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-theme-muted leading-relaxed">
            <p>
              LaundryConnect provides on-demand doorstep collection, professional washing, dry cleaning, steam ironing, and return delivery for clothing, bedding, and specialized garments.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-theme-primary">Payment-First Policy:</strong> Orders are created in draft state. Booking slots, dispatch priority, and rider assignment are officially confirmed only upon successful payment verification via Razorpay.
              </li>
              <li>
                <strong className="text-theme-primary">Slot Reservation:</strong> Time slots are allocated via our conflict-detection scheduler. Customers are requested to be present at the scheduled pickup address during their chosen 2-hour window.
              </li>
              <li>
                <strong className="text-theme-primary">Garment Inspection:</strong> All collected items undergo physical inspection upon arrival at our central facility hub. If count discrepancies or pre-existing tears/burns are discovered, our team will document them and notify you before processing begins.
              </li>
            </ul>
          </div>
        </div>

        {/* 2. Turnaround & Delivery Pricing */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-theme-elevated text-theme-accent border border-theme">
              <RefreshCw className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-theme-primary">
              2. Turnaround Times &amp; Delivery Fees
            </h2>
          </div>
          <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-theme-muted leading-relaxed">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-theme-primary">Standard Turnaround:</strong> 48 to 72 hours from the completion of doorstep pickup to delivery.
              </li>
              <li>
                <strong className="text-theme-primary">24-Hour Express Turnaround:</strong> Available for an optional ₹150 express fee. Express orders receive priority heap processing for 24-hour return from collection.
              </li>
              <li>
                <strong className="text-theme-primary">Delivery Calculation:</strong> Base charge of ₹20 covers the initial 3 km from our Jalandhar Central Hub; additional transit is billed at ₹8 per km (rounded up). Delivery is 100% free when the item subtotal exceeds ₹349.
              </li>
              <li>
                <strong className="text-theme-primary">Distant Addresses:</strong> Deliveries exceeding 25 km from the central facility hub are subject to extended transit schedules as communicated during checkout.
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Cancellations & Refunds */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-theme-elevated text-theme-accent border border-theme">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-theme-primary">
              3. Cancellations &amp; Refund Policy
            </h2>
          </div>
          <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-theme-muted leading-relaxed">
            <p>
              You may cancel an order free of charge at any time prior to the arrival of our delivery partner for doorstep pickup. Once garments have been collected by our delivery partner, cancellation is no longer permitted as cleaning processing begins immediately.
            </p>
            <p>
              In the rare event of service non-fulfillment or billing adjustments, authorized refunds will be credited back to your original payment source (bank account / UPI / card) via Razorpay within 5–7 business days.
            </p>
          </div>
        </div>

        {/* 4. Fabric Care & Liability Limitations */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-theme-elevated text-theme-accent border border-theme">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-theme-primary">
              4. Fabric Care &amp; Limitation of Liability
            </h2>
          </div>
          <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-theme-muted leading-relaxed">
            <p>
              While LaundryConnect uses certified detergents and modern garment cleaning machines, please observe the following guidelines:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-theme-primary">Valuables in Pockets:</strong> Customers are responsible for removing coins, pens, jewelry, cash, and keys from garment pockets prior to pickup. LaundryConnect cannot be held liable for damage caused by items left in pockets.
              </li>
              <li>
                <strong className="text-theme-primary">Manufacturer Deficiencies:</strong> We adhere strictly to fabric wash-care labels. We cannot accept liability for normal wear and tear, color bleeding caused by manufacturer dyes that violate wash-care standards, or pre-existing weak seams.
              </li>
              <li>
                <strong className="text-theme-primary">Loss or Damage Cap:</strong> In the substantiated event of lost or irrecoverably damaged garments due to facility negligence, our maximum liability is capped at 5 times the individual cleaning fee for that specific item.
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Note */}
        <div className="bg-theme-elevated/60 border border-theme rounded-3xl p-6 text-center text-xs text-theme-muted">
          <p className="font-semibold text-theme-primary mb-1">Demonstration Notice</p>
          <p>
            This is template content for demonstration purposes and does not constitute legal advice.
          </p>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;
