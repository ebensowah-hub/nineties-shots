import React, { useState } from 'react';
import { PortfolioItem, CategorySlug, ActivePage } from '../types';
import { portfolioCategories, siteConfig } from '../data/siteConfig';
import { servicesData } from '../data/servicesData';
import { aboutData } from '../data/aboutData';
import { photographerPortrait } from '../data/portfolioData';
import { Hero } from './Hero';
import { SelectedWork } from './SelectedWork';
import { PortfolioCard } from './PortfolioCard';
import { ImageWithFallback } from './ImageWithFallback';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCinematicMotion } from '../lib/motion';

interface HomeViewProps {
  portfolioItems: PortfolioItem[];
  onOpenLightbox: (item: PortfolioItem) => void;
  onNavigate: (page: ActivePage, category?: CategorySlug) => void;
  onRequestQuote: (serviceTitle: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  portfolioItems,
  onOpenLightbox,
  onNavigate,
  onRequestQuote
}) => {
  const { reduceMotion, cinematicEase } = useCinematicMotion();
  const [activeSpotlightCat, setActiveSpotlightCat] = useState<CategorySlug>('portraits');

  const spotlightItems = portfolioItems
    .filter(item => item.category === activeSpotlightCat)
    .slice(0, 3);

  const scrollToSelectedWork = () => {
    const el = document.getElementById('selected-work');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onNavigate('work');
    }
  };

  return (
    <div className="w-full">
      {/* 1. Full-Screen Hero */}
      <Hero
        onViewWork={scrollToSelectedWork}
        onBookShoot={() => onNavigate('contact')}
      />

      {/* 2. Selected Work (Editorial Asymmetric Composition) */}
      <SelectedWork
        items={portfolioItems}
        onOpenLightbox={onOpenLightbox}
        onExploreAll={(cat) => onNavigate('work', cat)}
      />

      {/* 3. Short Brand Statement (Dramatic Typography & High Contrast) */}
      <section className="py-24 md:py-32 bg-[#060606] border-y border-neutral-900/80 px-6 md:px-10">
        <div className="max-w-5xl mx-auto space-y-8 text-left">
          <motion.span
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: reduceMotion ? 0 : 0.7, ease: cinematicEase }}
            className="text-[11px] font-mono tracking-[0.3em] uppercase text-neutral-500 block"
          >
            THE MANIFESTO // NINETIES SHOTS
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: reduceMotion ? 0 : 0.85, delay: reduceMotion ? 0 : 0.1, ease: cinematicEase }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-light text-white tracking-tight uppercase leading-[1.05]"
          >
            &ldquo;WE DO NOT JUST CAPTURE WHAT IT LOOKED LIKE. WE CAPTURE THE WAY IT FELT.&rdquo;
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.25, ease: cinematicEase }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 text-neutral-400 font-light text-base md:text-lg leading-relaxed"
          >
            <p>
              Light, motion, and raw human presence. NINETIES SHOTS strips away algorithmic gloss to uncover timeless visual storytelling across portraits, lifestyle, and creative photo shoots.
            </p>
            <p>
              Every frame is intentional. Grounded in 35mm discipline and contemporary medium format resolution, we create imagery that commands attention and stays memorable.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 4. Featured Category Spotlight */}
      <section className="py-24 md:py-32 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 0.7, ease: cinematicEase }}
          >
            <span className="text-[11px] font-mono tracking-[0.25em] text-neutral-500 uppercase block mb-2">
              CURATED SPOTLIGHT
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-white uppercase tracking-tight">
              Disciplines in Focus
            </h2>
          </motion.div>

          {/* Quick discipline switchers */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {(['portraits', 'lifestyle', 'photo-shoots'] as CategorySlug[]).map(cat => {
              const isActive = activeSpotlightCat === cat;
              const catObj = portfolioCategories.find(c => c.id === cat);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveSpotlightCat(cat)}
                  className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors border relative ${
                    isActive
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white'
                  }`}
                >
                  {catObj?.name || cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Featured Spotlight Frames with seamless cross-dissolve transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSpotlightCat}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: cinematicEase }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {spotlightItems.map(item => (
              <PortfolioCard
                key={item.id}
                item={item}
                onClick={() => onOpenLightbox(item)}
                layoutVariant="standard"
              />
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 text-right">
          <button
            onClick={() => onNavigate('work', activeSpotlightCat)}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-300 hover:text-white group"
          >
            <span>View all {activeSpotlightCat} works</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </section>

      {/* 5. About Preview */}
      <section className="py-24 md:py-32 bg-neutral-950/80 border-t border-neutral-900 px-6 md:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Portrait frame */}
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: reduceMotion ? 0 : 0.8, ease: cinematicEase }}
            className="lg:col-span-5 order-2 lg:order-1"
          >
            <div className="border border-neutral-800 bg-neutral-950 p-3">
              <ImageWithFallback
                src={photographerPortrait.url}
                alt={photographerPortrait.alt}
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="mt-3 px-2 py-1 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>BEHIND THE LENS</span>
                <span>NINETIES SHOTS</span>
              </div>
            </div>
          </motion.div>

          {/* Philosophy text */}
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.15, ease: cinematicEase }}
            className="lg:col-span-7 space-y-6 order-1 lg:order-2"
          >
            <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-neutral-500 block">
              BEHIND THE BRAND
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-white uppercase tracking-tight leading-[1.1]">
              A Raw, Modern Eye on Human Energy
            </h2>
            <p className="text-base md:text-lg text-neutral-300 font-light leading-relaxed">
              {aboutData.story[0]}
            </p>
            <p className="text-sm md:text-base text-neutral-400 font-light leading-relaxed">
              {aboutData.story[1]}
            </p>
            <div className="pt-4">
              <button
                onClick={() => onNavigate('about')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 border border-neutral-700 hover:border-white text-xs font-mono uppercase tracking-[0.2em] text-white transition-colors"
              >
                <span>Read Full Philosophy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 6. Services Preview (Compact Editorial Strip) */}
      <section className="py-24 md:py-32 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: reduceMotion ? 0 : 0.7, ease: cinematicEase }}
          >
            <span className="text-[11px] font-mono tracking-[0.25em] text-neutral-500 uppercase block mb-2">
              COMMISSIONS & SCOPES
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading text-white uppercase tracking-tight">
              Services
            </h2>
          </motion.div>
          <button
            onClick={() => onNavigate('services')}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-neutral-300 hover:text-white"
          >
            <span>View detailed offerings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {servicesData.slice(0, 3).map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : index * 0.12, ease: cinematicEase }}
              className="p-8 bg-neutral-950 border border-neutral-800 flex flex-col justify-between hover:border-neutral-600 transition-colors group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between text-neutral-500 font-mono text-xs">
                  <span>0{index + 1}</span>
                  <span className="uppercase">{service.category}</span>
                </div>
                <h3 className="text-xl font-heading uppercase text-white tracking-wide group-hover:text-neutral-200">
                  {service.title}
                </h3>
                <p className="text-xs text-neutral-400 font-light leading-relaxed">
                  {service.tagline}
                </p>
              </div>

              <div className="pt-8 border-t border-neutral-900 mt-8 flex items-center justify-between">
                <button
                  onClick={() => onRequestQuote(service.title)}
                  className="text-xs font-mono uppercase tracking-wider text-white hover:text-neutral-300 flex items-center gap-1.5"
                >
                  <span>Request a Quote</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 7. Booking & Direct Commission CTA Banner */}
      <section className="py-24 md:py-32 bg-[#060606] border-t border-neutral-900 px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: cinematicEase }}
          className="max-w-5xl mx-auto text-center space-y-8"
        >
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-neutral-500 block">
            COMMISSION INQUIRIES 2026
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-heading font-light text-white uppercase tracking-tight leading-[1.05]">
            READY TO CREATE SOMETHING PERMANENT?
          </h2>
          <p className="text-base sm:text-lg text-neutral-400 font-light max-w-xl mx-auto leading-relaxed">
            Whether for individual portraits, natural lifestyle moments, or creative photo shoots.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('contact')}
              className="w-full sm:w-auto px-9 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors"
            >
              Book a Shoot
            </button>
            <button
              onClick={() => onNavigate('work')}
              className="w-full sm:w-auto px-9 py-4 bg-transparent border border-neutral-700 hover:border-white text-xs font-semibold uppercase tracking-[0.2em] text-white transition-colors"
            >
              Explore Portfolio
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
