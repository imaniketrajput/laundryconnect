import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Sparkles, MapPin, Phone } from 'lucide-react';

const GithubIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'LinkedIn', icon: LinkedinIcon, url: 'https://www.linkedin.com/in/aniket-singh-as/' },
    { name: 'GitHub', icon: GithubIcon, url: 'https://github.com/imaniketrajput' },
    { name: 'Instagram', icon: InstagramIcon, url: 'https://www.instagram.com/imaniketrajput/?hl=en' },
    { name: 'Gmail', icon: (props) => <Mail className="h-5 w-5" {...props} />, url: 'mailto:as.thakuraniket@gmail.com' },
  ];

  return (
    <footer className="bg-theme-secondary text-theme-muted border-t border-theme pt-12 sm:pt-16 pb-24 sm:pb-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Column 1: Branding */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center space-x-2 group">
              <div className="bg-theme-elevated p-2 rounded-xl text-theme-accent border border-theme">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-theme-primary font-poppins">
                Laundry<span className="text-theme-accent">Connect</span>
              </span>
            </Link>
            <p className="text-sm text-theme-muted font-sans leading-relaxed">
              Your smart fabric care partner. We collect, clean, and deliver premium laundry and dry cleaning services right to your doorstep. Powered by advanced algorithms for route optimization and priority scheduling.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4 md:ml-12">
            <h3 className="text-theme-primary font-bold font-poppins text-lg tracking-wide border-l-4 border-theme-accent pl-3">
              Quick Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-theme-accent transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-theme-accent transition-colors duration-200">
                  Services &amp; Pricing
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-theme-accent transition-colors duration-200">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/schedule" className="hover:text-theme-accent transition-colors duration-200">
                  Schedule Pickup
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-theme-accent transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-theme-accent transition-colors duration-200">
                  FAQs &amp; Help
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-theme-accent transition-colors duration-200">
                  Contact &amp; Support
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-theme-accent transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-theme-accent transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Socials */}
          <div className="space-y-4">
            <h3 className="text-theme-primary font-bold font-poppins text-lg tracking-wide border-l-4 border-theme-accent pl-3">
              Get in Touch
            </h3>
            <div className="space-y-3 text-sm text-theme-muted">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-theme-accent" />
                <a href="mailto:as.thakuraniket@gmail.com" className="hover:text-theme-primary transition-colors">
                  as.thakuraniket@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-theme-accent" />
                <span>+91 86508 65586</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-theme-accent" />
                <span>48+ Cities, India</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-theme-elevated hover:bg-theme-accent hover:text-white p-2.5 rounded-xl transition-all duration-300 text-theme-primary border border-theme hover:-translate-y-1 shadow-md flex items-center justify-center theme-btn-hover"
                  title={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-theme pt-8 mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-theme-muted">
          <p className="mb-2 sm:mb-0">
            &copy; {currentYear} LaundryConnect. All rights reserved. &bull; Founder &amp; Developer:{' '}
            <a
              href="https://www.linkedin.com/in/aniket-singh-as/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-theme-accent font-bold transition-colors hover:underline"
            >
              Aniket Singh Rajput
            </a>
          </p>
          <p className="font-medium text-theme-muted">
            Crafted with modern full-stack engineering &amp; passion.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
