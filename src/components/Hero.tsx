import React, { useRef } from 'react';
import { heroImage } from '../data/portfolioData';
import { siteConfig } from '../data/siteConfig';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useCinematicMotion } from '../lib/motion';

interface HeroProps {
  onViewWork: () => void;
  onBookShoot: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onViewWork, onBookShoot }) => {
  const { reduceMotion, filmicEase, cinematicEase } = useCinematicMotion();
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Restrained, elegant cinematic depth (no aggressive jumping or nausea)
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.15]);
  const contentY = useTransform(scrollYProgress, [0, 0.75], [0, 40]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[100svh] min-h-[640px] flex items-center justify-center overflow-hidden bg-[#060606]"
    >
      {/* Background Hero Photography with subtle filmic scale and restrained parallax */}
      <motion.div
        style={reduceMotion ? undefined : { y: imageY, scale: imageScale }}
        initial={{ scale: reduceMotion ? 1 : 1.08, opacity: reduceMotion ? 1 : 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 2.2, ease: filmicEase }}
        className="absolute inset-0 w-full h-full will-change-transform"
      >
        <img
          src={heroImage.url}
          alt={heroImage.alt}
          fetchPriority="high"
          loading="eager"
          className="w-full h-full object-cover object-center filter brightness-[0.76] contrast-[1.06]"
        />

        {/* Film grain subtle overlay */}
        <div className="absolute inset-0 film-grain pointer-events-none" />

        {/* Cinematic Vignette and soft gradient masks for quiet luxury drama */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/45" />
      </motion.div>

      {/* Main Editorial Hero Content */}
      <motion.div
        style={reduceMotion ? undefined : { opacity: contentOpacity, y: contentY }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 h-full flex flex-col justify-between pt-24 sm:pt-32 pb-8 sm:pb-12"
      >
        {/* Top Header Tagline */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.15, ease: cinematicEase }}
          className="flex items-center justify-between"
        >
          <span className="text-[11px] font-mono tracking-[0.3em] text-neutral-300 uppercase">
            ARCHIVE 2026 // VOL. 01
          </span>
          <span className="text-[11px] font-mono tracking-[0.25em] text-neutral-400 uppercase hidden sm:inline">
            WORLDWIDE COMMISSIONS
          </span>
        </motion.div>

        {/* Center Display Typography: Coordinated Reveal */}
        <div className="my-auto text-left max-w-4xl">
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: reduceMotion ? 0 : 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 1.0, delay: reduceMotion ? 0 : 0.28, ease: filmicEase }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-[-0.03em] font-heading text-white uppercase leading-[0.9] drop-shadow-lg"
            >
              NINETIES
              <br />
              <span className="font-light text-neutral-200">SHOTS</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.85, delay: reduceMotion ? 0 : 0.45, ease: cinematicEase }}
              className="text-lg sm:text-xl md:text-2xl font-light text-neutral-300 tracking-wide font-sans max-w-xl pt-2"
            >
              {siteConfig.tagline}
            </motion.p>
          </div>
        </div>

        {/* Bottom Bar: Action CTAs and Restrained Scroll Cue */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.6, ease: cinematicEase }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-6 border-t border-white/15"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={onViewWork}
              data-cursor="VIEW"
              className="px-7 py-3.5 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[44px]"
            >
              <span>View Work</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              onClick={onBookShoot}
              className="px-7 py-3.5 bg-transparent text-white text-xs font-semibold uppercase tracking-[0.2em] border border-white/40 hover:border-white hover:bg-white/10 transition-all outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[44px] text-center"
            >
              Book a Shoot
            </button>
          </div>

          {/* Minimalist scroll cue with gentle meditative breathing pulse */}
          <button
            onClick={onViewWork}
            className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors group cursor-pointer"
            aria-label="Scroll to selected work"
          >
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase">
              EXPLORE EXHIBITION
            </span>
            <div className="w-8 h-8 rounded-full border border-neutral-700 flex items-center justify-center group-hover:border-white transition-colors">
              <motion.div
                animate={reduceMotion ? { y: 0 } : { y: [0, 3, 0] }}
                transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </motion.div>
            </div>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
};

