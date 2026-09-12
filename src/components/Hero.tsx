import React, { useRef } from 'react';
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

  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0.1]);
  const contentY = useTransform(scrollYProgress, [0, 0.75], [0, 30]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[100svh] min-h-[640px] flex items-center justify-center overflow-hidden bg-white border-b border-neutral-200 select-none"
    >
      {/* Main Editorial Hero Content */}
      <motion.div
        style={reduceMotion ? undefined : { opacity: contentOpacity, y: contentY }}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 h-full flex flex-col justify-between pt-24 sm:pt-28 pb-8 sm:pb-12"
      >
        {/* Top Header Tagline */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.1, ease: cinematicEase }}
          className="flex items-center justify-between pt-2"
        >
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] text-neutral-500 uppercase">
            ARCHIVE 2026 // VOL. 01
          </span>
          <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-neutral-500 uppercase hidden sm:inline">
            WORLDWIDE COMMISSIONS
          </span>
        </motion.div>

        {/* Center Display: Official NINETIES SHOTS Logo from IMG_2162.jpeg as permanent hero visual */}
        <div className="my-auto text-center flex flex-col items-center justify-center max-w-4xl mx-auto py-4 sm:py-8 w-full">
          <motion.div
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.9, delay: reduceMotion ? 0 : 0.15, ease: filmicEase }}
            className="w-full flex items-center justify-center px-4"
          >
            {/* 
              Black logo on pure white background.
              Proportions are strictly preserved using object-contain.
              Never stretched, never squeezed, never cropped.
            */}
            <img
              src="/IMG_2162.jpeg"
              alt="NINETIES SHOTS"
              fetchPriority="high"
              loading="eager"
              className="w-auto h-auto max-w-[88vw] sm:max-w-md md:max-w-xl lg:max-w-2xl max-h-[44vh] sm:max-h-[50vh] md:max-h-[56vh] object-contain mx-auto"
              style={{ objectFit: 'contain' }}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.35, ease: cinematicEase }}
            className="mt-6 sm:mt-8 text-xs sm:text-sm md:text-base font-light text-neutral-700 tracking-[0.26em] uppercase font-sans"
          >
            Photography. Stories. Moments.
          </motion.p>
        </div>

        {/* Bottom Bar: Action CTAs and Restrained Scroll Cue */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.45, ease: cinematicEase }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-6 border-t border-neutral-200"
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={onViewWork}
              data-cursor="VIEW"
              className="px-8 py-3.5 bg-black text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all duration-300 flex items-center justify-center gap-2 group outline-none focus-visible:ring-2 focus-visible:ring-black min-h-[44px]"
            >
              <span>View Work</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>

            <button
              onClick={onBookShoot}
              className="px-8 py-3.5 bg-transparent text-black text-xs font-medium uppercase tracking-[0.2em] border border-neutral-300 hover:border-black hover:bg-black hover:text-white transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-black min-h-[44px] text-center"
            >
              Book a Shoot
            </button>
          </div>

          {/* Minimalist scroll cue */}
          <button
            onClick={onViewWork}
            className="flex items-center gap-3 text-neutral-500 hover:text-black transition-colors group cursor-pointer self-center sm:self-auto"
            aria-label="Scroll to selected work"
          >
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase">
              EXPLORE ARCHIVE
            </span>
            <div className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center group-hover:border-black transition-colors">
              <motion.div
                animate={reduceMotion ? { y: 0 } : { y: [0, 3, 0] }}
                transition={reduceMotion ? { duration: 0 } : { repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
              >
                <ArrowDown className="w-3.5 h-3.5 text-neutral-700 group-hover:text-black" />
              </motion.div>
            </div>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
};

