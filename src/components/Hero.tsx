import React from 'react';
import { heroImage } from '../data/portfolioData';
import { siteConfig } from '../data/siteConfig';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onViewWork: () => void;
  onBookShoot: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onViewWork, onBookShoot }) => {
  return (
    <section className="relative w-full h-[100svh] min-h-[640px] flex items-center justify-center overflow-hidden bg-[#060606]">
      {/* Background Hero Photography with subtle cinematic scale */}
      <motion.div
        initial={{ scale: 1.08, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src={heroImage.url}
          alt={heroImage.alt}
          fetchPriority="high"
          loading="eager"
          className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.05]"
        />

        {/* Film grain subtle overlay */}
        <div className="absolute inset-0 film-grain pointer-events-none" />

        {/* Cinematic Vignette and subtle gradient mask for dramatic contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </motion.div>

      {/* Main Editorial Hero Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 h-full flex flex-col justify-between pt-32 pb-12">
        {/* Top Header Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <span className="text-[11px] font-mono tracking-[0.3em] text-neutral-300 uppercase">
            ARCHIVE 2026 // VOL. 01
          </span>
          <span className="text-[11px] font-mono tracking-[0.25em] text-neutral-400 uppercase hidden sm:inline">
            WORLDWIDE COMMISSIONS
          </span>
        </motion.div>

        {/* Center Display Typography */}
        <div className="my-auto text-left max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-[-0.03em] font-heading text-white uppercase leading-[0.9] drop-shadow-lg">
              NINETIES
              <br />
              <span className="font-light text-neutral-200">SHOTS</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl font-light text-neutral-300 tracking-wide font-sans max-w-xl pt-2">
              {siteConfig.tagline}
            </p>
          </motion.div>
        </div>

        {/* Bottom Bar: Action CTAs and Scroll cue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-6 border-t border-white/15"
        >
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onViewWork}
              data-cursor="VIEW"
              className="px-7 py-3.5 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all flex items-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>View Work</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={onBookShoot}
              className="px-7 py-3.5 bg-transparent text-white text-xs font-semibold uppercase tracking-[0.2em] border border-white/40 hover:border-white hover:bg-white/10 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Book a Shoot
            </button>
          </div>

          {/* Minimalist scroll cue */}
          <button
            onClick={onViewWork}
            className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors group cursor-pointer"
            aria-label="Scroll to selected work"
          >
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase">
              EXPLORE EXHIBITION
            </span>
            <div className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center group-hover:border-white transition-colors">
              <ArrowDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
            </div>
          </button>
        </motion.div>
      </div>
    </section>
  );
};
