import React from 'react';
import { ActivePage, CategorySlug } from '../types';
import { siteConfig } from '../data/siteConfig';
import { ArrowUp, Instagram, MessageSquare, ArrowUpRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: ActivePage, category?: CategorySlug) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks: { label: string; page: ActivePage }[] = [
    { label: 'Selected Work', page: 'work' },
    { label: 'Philosophy & About', page: 'about' },
    { label: 'Commission Services', page: 'services' },
    { label: 'Contact & Bookings', page: 'contact' }
  ];

  return (
    <footer className="border-t border-neutral-900 bg-[#060606] text-neutral-400 pt-20 pb-12 px-6 md:px-10">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Upper Grid: Brand Statement & Navigations */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-xl md:text-2xl font-heading font-bold text-white uppercase tracking-[0.18em]">
              {siteConfig.brandName}
            </h3>
            <p className="text-sm text-neutral-400 font-light max-w-sm leading-relaxed">
              {siteConfig.manifesto.subheadline}
            </p>
            <p className="text-xs font-mono text-neutral-500 pt-2">
              {siteConfig.contact.location}
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase block">
              DIRECTORY
            </span>
            <ul className="space-y-2.5">
              {navLinks.map(link => (
                <li key={link.page}>
                  <button
                    onClick={() => {
                      onNavigate(link.page);
                      scrollToTop();
                    }}
                    className="text-xs uppercase tracking-wider text-neutral-300 hover:text-white transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Socials & Direct Contact */}
          <div className="md:col-span-4 space-y-4">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase block">
              CONNECT & COMMISSIONS
            </span>
            <div className="space-y-2">
              {siteConfig.contact.email && (
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="text-xs font-mono text-neutral-200 hover:text-white hover:underline block"
                >
                  {siteConfig.contact.email}
                </a>
              )}
              <a
                href={`https://wa.me/${siteConfig.contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-neutral-400 hover:text-white font-mono block transition-colors"
              >
                WhatsApp / Call: <span className="text-white">{siteConfig.contact.phone || siteConfig.contact.whatsappNumber}</span>
              </a>
            </div>

            <div className="pt-2 flex flex-wrap gap-4">
              {siteConfig.socials.map(social => (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                >
                  <span>{social.label}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Large Typography Brand Marquee / Monolith */}
        <div className="pt-8 border-t border-neutral-900/80 select-none">
          <div className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-heading font-black text-neutral-900 tracking-tighter uppercase leading-none overflow-hidden whitespace-nowrap">
            NINETIES SHOTS
          </div>
        </div>

        {/* Bottom Bar: Copyright, Owner Portal, and Back to Top */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <div className="flex items-center gap-4">
            <span>© {siteConfig.copyrightYear} {siteConfig.brandName}. ALL RIGHTS RESERVED.</span>
            <span className="text-neutral-800">•</span>
            <button
              onClick={() => {
                window.location.hash = 'admin';
              }}
              className="text-neutral-600 hover:text-neutral-400 text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
            >
              Portal Login
            </button>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group cursor-pointer"
            aria-label="Back to top of page"
          >
            <span className="text-[10px] uppercase tracking-widest">Back to top</span>
            <div className="w-6 h-6 rounded-full border border-neutral-800 flex items-center justify-center group-hover:border-neutral-500">
              <ArrowUp className="w-3 h-3" />
            </div>
          </button>
        </div>
      </div>
    </footer>
  );
};
