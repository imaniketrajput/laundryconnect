import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, Database, Trash2, MapPin, CreditCard, Sparkles } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-theme-bg text-theme-primary overflow-x-hidden font-sans transition-colors duration-200">
      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <section className="relative bg-theme-hero text-theme-hero py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-theme">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-theme-accent border border-white/15 text-xs font-bold font-poppins uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Trust &amp; Transparency</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-poppins text-theme-hero tracking-tight">
            Privacy <span className="text-theme-accent">Policy</span>
          </h1>
          <p className="text-theme-hero-muted text-sm sm:text-base max-w-xl mx-auto">
            Last updated: September 2026 &bull; How LaundryConnect collects, uses, protects, and respects your personal data.
          </p>
        </div>
      </section>

      {/* ── 2. LEGAL SECTIONS ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
        {/* Intro */}
        <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 shadow-theme-sm space-y-4 leading-relaxed text-sm sm:text-base text-theme-muted">
          <p>
            At <strong className="text-theme-primary">LaundryConnect</strong>, accessible from laundryconnect.com, one of our main priorities is the privacy of our visitors and customers. This Privacy Policy document outlines the types of information that is collected and recorded by LaundryConnect and how we utilize it.
          </p>
          <p>
            If you have additional questions or require more information about our Privacy Policy, please do not hesitate to contact us at{' '}
            <a href="mailto:as.thakuraniket@gmail.com" className="text-theme-accent hover:underline font-semibold">
              as.thakuraniket@gmail.com
            </a>.
          </p>
        </div>

        {/* 1. Data Collection */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-theme-elevated text-theme-accent border border-theme">
              <Database className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-theme-primary">
              1. Information We Collect
            </h2>
          </div>
          <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-theme-muted leading-relaxed">
            <p>We collect information strictly necessary to facilitate doorstep laundry pickup, cleaning, and delivery operations:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-theme-primary">Account Information:</strong> Name, email address, contact phone number, and encrypted password (or Google OAuth 2.0 ID if authenticating via Google).
              </li>
              <li>
                <strong className="text-theme-primary">Doorstep Delivery Addresses &amp; Coordinates:</strong> Physical street addresses, landmarks, and precise GPS latitude/longitude coordinates captured via OpenStreetMap/Nominatim to calculate accurate distance and dispatch delivery partners.
              </li>
              <li>
                <strong className="text-theme-primary">Profile Photo:</strong> Optional avatars uploaded via local files or captured in real time via live browser webcam/camera with explicit device permission. Images are compressed client-side to minimize storage footprint.
              </li>
              <li>
                <strong className="text-theme-primary">Transactional Order History:</strong> Garment selections, quantities, special care requests, pickup/delivery slots, and tax invoices.
              </li>
            </ul>
          </div>
        </div>

        {/* 2. Data Use */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-theme-elevated text-theme-accent border border-theme">
              <Eye className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-theme-primary">
              2. How We Use Your Information
            </h2>
          </div>
          <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-theme-muted leading-relaxed">
            <p>The information we collect is utilized strictly for service delivery:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>To allocate conflict-free pickup time slots and compute spherical distance-based delivery fees from our Jalandhar facility hub.</li>
              <li>To generate route-optimized delivery stops for our delivery partners using Dijkstra's shortest-path algorithm.</li>
              <li>To transmit transactional status updates (email receipts, invoice attachments, and out-for-delivery alerts) via our Nodemailer SMTP transport.</li>
              <li>To display live partner vehicle locations on the interactive Leaflet tracking map while an order is actively in transit.</li>
              <li>To provide customer support and track inquiry lifecycle via our Support Ticket System.</li>
            </ul>
          </div>
        </div>

        {/* 3. Payments & Financial Security */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-theme-elevated text-theme-accent border border-theme">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-theme-primary">
              3. Payments &amp; Financial Security (Razorpay)
            </h2>
          </div>
          <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-theme-muted leading-relaxed">
            <p>
              All online payments on LaundryConnect are handled via <strong className="text-theme-primary">Razorpay Software Private Limited</strong>, an RBI-authorized and PCI-DSS Level 1 compliant payment gateway.
            </p>
            <p>
              LaundryConnect does <strong>NOT</strong> process, capture, or store raw credit card numbers, CVVs, or net banking credentials on our database servers. Payment verification is performed strictly through server-to-server cryptographic HMAC-SHA256 signature verification.
            </p>
          </div>
        </div>

        {/* 4. Real-Time Telemetry & Location Data */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-theme-elevated text-theme-accent border border-theme">
              <MapPin className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-theme-primary">
              4. Real-Time Telemetry &amp; Location Data
            </h2>
          </div>
          <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-theme-muted leading-relaxed">
            <p>
              During active delivery runs, delivery partners stream GPS telemetry over authenticated WebSocket connections (`Socket.io`). These coordinates are shared only with the specific customer whose order is actively in transit within that order's secure room. Partner location broadcasting ceases immediately once an order is marked Delivered.
            </p>
          </div>
        </div>

        {/* 5. GDPR Account Deletion & Right to be Forgotten */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-theme-elevated text-theme-accent border border-theme">
              <Trash2 className="h-5 w-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-poppins text-theme-primary">
              5. GDPR-Compliant Account Deletion &amp; Data Retention
            </h2>
          </div>
          <div className="bg-theme-card border border-theme rounded-3xl p-6 sm:p-8 space-y-4 text-sm sm:text-base text-theme-muted leading-relaxed">
            <p>
              We believe in full ownership of personal data. Registered customers and delivery partners can delete their accounts at any time directly through their Profile settings page by confirming with the command <code className="bg-theme-elevated px-2 py-0.5 rounded text-theme-accent font-bold">DELETE</code>.
            </p>
            <p>
              Upon deletion:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>All personally identifiable information (PII) including name, phone number, saved address coordinates, profile photo, and password hashes are permanently anonymized and scrubbed.</li>
              <li>Operational chat logs between customer and partner are automatically purged within 7 days via MongoDB TTL indexes.</li>
              <li>Historical financial transactions and tax invoices are retained in anonymized form strictly as required to comply with statutory accounting and tax regulations.</li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Note */}
        <div className="bg-theme-elevated/60 border border-theme rounded-3xl p-6 text-center text-xs text-theme-muted">
          <p className="font-semibold text-theme-primary mb-1">Demonstration Notice</p>
          <p>
            This is template content for demonstration purposes and does not constitute formal legal advice.
          </p>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
