import React, { useState, useEffect } from 'react';
import { ActivePage, CategorySlug } from '../types';
import { siteConfig } from '../data/siteConfig';
import { BrandLogo } from './BrandLogo';
import { Menu, X, ArrowUpRight, Instagram, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCinematicMotion } from '../lib/motion';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage, category?: CategorySlug) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, onNavigate }) => {
  const { reduceMotion, cinematicEase } = useCinematicMotion();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll and listen for Escape key when mobile menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navLinks: { label: string; page: ActivePage }[] = [
    { label: 'Work', page: 'work' },
    { label: 'About', page: 'about' },
    { label: 'Services', page: 'services' },
    { label: 'Contact', page: 'contact' }
  ];

  const handleNavClick = (page: ActivePage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  const isHeroLight = activePage === 'home' && !isScrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#080808]/92 backdrop-blur-md border-b border-neutral-900/80 py-3.5 shadow-2xl shadow-black/40'
            : isHeroLight
              ? 'bg-transparent py-5 md:py-7'
              : 'bg-[#080808]/80 backdrop-blur-sm py-5 md:py-7 border-b border-neutral-900/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
          {/* Official Brand Mark / Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="group flex items-center gap-3.5 outline-none focus-visible:ring-2 focus-visible:ring-black transition-transform hover:opacity-90"
            aria-label="NINETIES SHOTS Homepage"
          >
            <BrandLogo
              size="md"
              priority
              variant={isHeroLight ? 'black' : 'white'}
              className="transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <span className="sr-only">NINETIES SHOTS</span>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-9" aria-label="Main Navigation">
            {navLinks.map(link => {
              const isActive = activePage === link.page;
              return (
                <button
                  key={link.page}
                  onClick={() => handleNavClick(link.page)}
                  className={`text-xs uppercase tracking-[0.22em] font-medium transition-colors relative py-1 outline-none focus-visible:ring-1 ${
                    isHeroLight
                      ? isActive
                        ? 'text-black font-semibold focus-visible:ring-black'
                        : 'text-neutral-600 hover:text-black focus-visible:ring-black'
                      : isActive
                        ? 'text-white font-semibold focus-visible:ring-white'
                        : 'text-neutral-400 hover:text-white focus-visible:ring-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId={reduceMotion ? undefined : "activeNavIndicator"}
                      className={`absolute bottom-0 left-0 right-0 h-px ${isHeroLight ? 'bg-black' : 'bg-white'}`}
                      transition={{ duration: reduceMotion ? 0 : 0.3, ease: cinematicEase }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Action CTA: Refined Quiet Luxury */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => handleNavClick('contact')}
              className={`px-6 py-2.5 bg-transparent border text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 outline-none ${
                isHeroLight
                  ? 'border-neutral-900 text-black hover:bg-black hover:text-white focus-visible:ring-2 focus-visible:ring-black'
                  : 'border-neutral-600 hover:border-white text-white hover:bg-white hover:text-black focus-visible:ring-2 focus-visible:ring-white'
              }`}
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
              aria-controls="mobile-nav-menu"
              className={`p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors border ${
                isHeroLight
                  ? 'text-black border-neutral-300 bg-white/90 hover:bg-white'
                  : 'text-neutral-300 hover:text-white border-neutral-800 bg-neutral-950/80'
              }`}
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
            id="mobile-nav-menu"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -12 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: cinematicEase }}
            className="fixed inset-0 z-30 bg-[#080808]/98 backdrop-blur-2xl pt-24 px-8 pb-10 flex flex-col justify-between md:hidden"
          >
            <div className="space-y-8">
              {/* Brand Logo inside mobile menu */}
              <div className="pb-4 border-b border-neutral-900/80">
                <BrandLogo size="lg" />
              </div>

              <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase block">
                Directory
              </span>
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link, idx) => {
                  const isActive = activePage === link.page;
                  return (
                    <button
                      key={link.page}
                      onClick={() => handleNavClick(link.page)}
                      className={`text-left text-2xl font-heading tracking-wide py-2 transition-colors flex items-center justify-between ${
                        isActive ? 'text-white font-bold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>{link.label}</span>
                      <span className="text-xs font-mono text-neutral-600">0{idx + 1}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-2">
                <button
                  onClick={() => handleNavClick('contact')}
                  className="w-full py-3.5 bg-white text-black text-center text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors"
                >
                  Book a Shoot
                </button>
              </div>
            </div>

            {/* Mobile Footer & Socials in Menu */}
            <div className="pt-6 border-t border-neutral-900 space-y-3">
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
