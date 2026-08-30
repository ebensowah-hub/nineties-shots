import React, { useState, useEffect } from 'react';
import { ActivePage, CategorySlug } from '../types';
import { siteConfig } from '../data/siteConfig';
import { Menu, X, ArrowUpRight, Instagram, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage, category?: CategorySlug) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { label: string; page: ActivePage }[] = [
    { label: 'Work', page: 'work' },
    { label: 'About', page: 'about' },
    { label: 'Services', page: 'services' },
    { label: 'Contact', page: 'contact' }
  ];

  const handleNavClick = (page: ActivePage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#080808]/90 backdrop-blur-md border-b border-neutral-900/80 py-4 shadow-lg shadow-black/20'
            : 'bg-transparent py-6 md:py-8'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
          {/* Brand Wordmark */}
          <button
            onClick={() => handleNavClick('home')}
            className="group text-left outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="NINETIES SHOTS Homepage"
          >
            <span className="font-heading font-bold text-lg md:text-xl tracking-[0.18em] text-white uppercase group-hover:text-neutral-300 transition-colors">
              NINETIES SHOTS
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
            {navLinks.map(link => {
              const isActive = activePage === link.page;
              return (
                <button
                  key={link.page}
                  onClick={() => handleNavClick(link.page)}
                  className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors relative py-1 outline-none focus-visible:ring-1 focus-visible:ring-white ${
                    isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 right-0 h-px bg-white"
                      transition={{ duration: 0.25 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Action CTA */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => handleNavClick('contact')}
              className="px-5 py-2.5 bg-white text-black text-xs font-semibold uppercase tracking-[0.18em] hover:bg-neutral-200 transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Book a Shoot
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
              className="p-2.5 text-neutral-300 hover:text-white border border-neutral-800 bg-neutral-950/60"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out / Fullscreen Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-30 bg-[#080808]/98 backdrop-blur-xl pt-24 px-8 pb-10 flex flex-col justify-between md:hidden"
          >
            <div className="space-y-6">
              <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
                Directory
              </span>
              <nav className="flex flex-col space-y-4">
                {navLinks.map((link, idx) => {
                  const isActive = activePage === link.page;
                  return (
                    <button
                      key={link.page}
                      onClick={() => handleNavClick(link.page)}
                      className={`text-left text-2xl font-heading uppercase tracking-wider py-2 transition-colors flex items-center justify-between ${
                        isActive ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>{link.label}</span>
                      <span className="text-xs font-mono text-neutral-600">0{idx + 1}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-4">
                <button
                  onClick={() => handleNavClick('contact')}
                  className="w-full py-3.5 bg-white text-black text-center text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors"
                >
                  Book a Shoot
                </button>
              </div>
            </div>

            {/* Mobile Footer & Socials in Menu */}
            <div className="pt-8 border-t border-neutral-900 space-y-4">
              <div className="text-xs text-neutral-400 font-mono">
                {siteConfig.contact.email ? (
                  <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white">
                    {siteConfig.contact.email}
                  </a>
                ) : (
                  <a
                    href={`https://wa.me/${siteConfig.contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    WhatsApp: {siteConfig.contact.phone || siteConfig.contact.whatsappNumber}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-5">
                {siteConfig.socials.map(social => (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase tracking-widest text-neutral-400 hover:text-white transition-colors"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
