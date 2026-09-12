import React, { useState, useMemo } from 'react';
import { PortfolioItem, CategorySlug } from '../types';
import { portfolioCategories } from '../data/siteConfig';
import { PortfolioCard } from './PortfolioCard';
import { SectionHeading } from './SectionHeading';
import { motion, AnimatePresence } from 'motion/react';
import { useCinematicMotion } from '../lib/motion';

interface PortfolioViewProps {
  items: PortfolioItem[];
  initialCategory?: CategorySlug;
  onOpenLightbox: (item: PortfolioItem) => void;
  onBookShoot?: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  items,
  initialCategory = 'all',
  onOpenLightbox,
  onBookShoot
}) => {
  const { reduceMotion, cinematicEase } = useCinematicMotion();
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>(initialCategory);

  // Filter items by selected category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter(item => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const activeCategoryObj = portfolioCategories.find(c => c.id === selectedCategory);

  // Asymmetric editorial layout generator
  const getEditorialLayout = (index: number) => {
    const cycle = index % 6;
    switch (cycle) {
      case 0:
        // Grand hero editorial photograph
        return {
          colSpan: 'col-span-12 lg:col-span-10 lg:col-start-2',
          variant: 'editorial-wide' as const,
          priority: index === 0
        };
      case 1:
        // Tall vertical frame
        return {
          colSpan: 'col-span-12 md:col-span-5',
          variant: 'editorial-tall' as const,
          priority: false
        };
      case 2:
        // Wide landscape partner with subtle vertical offset
        return {
          colSpan: 'col-span-12 md:col-span-7 md:pt-16',
          variant: 'editorial-wide' as const,
          priority: false
        };
      case 3:
        // Centerpiece portrait framed by generous negative space
        return {
          colSpan: 'col-span-12 md:col-span-7 md:col-start-3',
          variant: 'editorial-large' as const,
          priority: false
        };
      case 4:
        // Asymmetric medium width left
        return {
          colSpan: 'col-span-12 md:col-span-6',
          variant: 'editorial-wide' as const,
          priority: false
        };
      case 5:
        // Supporting tall vertical right with offset
        return {
          colSpan: 'col-span-12 md:col-span-5 md:col-start-8 md:pt-12',
          variant: 'editorial-tall' as const,
          priority: false
        };
      default:
        return {
          colSpan: 'col-span-12 md:col-span-6',
          variant: 'standard' as const,
          priority: false
        };
    }
  };

  return (
    <div className="pt-32 sm:pt-36 pb-36 px-6 md:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Editorial Section Heading */}
      <SectionHeading
        tag="Archive & Commissions"
        title="Portfolio"
        subtitle={activeCategoryObj?.description || 'Curated editorial photographs spanning Portraits, Lifestyle, and Photo Shoots.'}
      />

      {/* Understated Category Navigation */}
      <nav
        aria-label="Portfolio Disciplines"
        className="flex items-center gap-6 sm:gap-10 overflow-x-auto pb-4 mb-16 sm:mb-24 border-b border-neutral-900 scrollbar-none"
      >
        {portfolioCategories.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-xs sm:text-sm font-mono uppercase tracking-[0.24em] py-2 relative transition-colors outline-none focus-visible:ring-1 focus-visible:ring-white whitespace-nowrap cursor-pointer ${
                isSelected ? 'text-white font-semibold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span>{cat.name}</span>
              {isSelected && (
                <motion.div
                  layoutId={reduceMotion ? undefined : "portfolioNavActiveIndicator"}
                  className="absolute bottom-0 left-0 right-0 h-px bg-white"
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: cinematicEase }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Asymmetric Editorial Gallery Presentation */}
      {filteredItems.length === 0 ? (
        <div className="py-28 text-center border border-neutral-900/60 bg-neutral-950/30 p-12">
          <p className="text-base font-heading text-neutral-400 uppercase tracking-widest">
            No frames in this collection
          </p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="mt-6 px-6 py-2.5 border border-neutral-800 hover:border-white text-xs font-mono uppercase tracking-widest text-neutral-300 hover:text-white transition-colors"
          >
            View All Photographs
          </button>
        </div>
      ) : (
        <motion.div
          layout={!reduceMotion}
          className="grid grid-cols-1 md:grid-cols-12 gap-y-16 sm:gap-y-24 md:gap-y-32 gap-x-8 md:gap-x-12 items-start"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => {
              const layout = getEditorialLayout(index);

              return (
                <motion.div
                  key={item.id}
                  layout={!reduceMotion}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.55,
                    delay: reduceMotion ? 0 : Math.min(index * 0.04, 0.25),
                    ease: cinematicEase
                  }}
                  className={layout.colSpan}
                >
                  <PortfolioCard
                    item={item}
                    onClick={() => onOpenLightbox(item)}
                    layoutVariant={layout.variant}
                    priority={layout.priority}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Understated Editorial Booking Invitation */}
      {onBookShoot && (
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: cinematicEase }}
          className="mt-28 sm:mt-36 pt-16 border-t border-neutral-900 flex flex-col md:flex-row md:items-end justify-between gap-8"
        >
          <div className="space-y-3 max-w-xl">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase block">
              COMMISSIONS & INQUIRIES
            </span>
            <h3 className="text-2xl sm:text-3xl font-heading text-white tracking-tight">
              Commission NINETIES SHOTS for your vision.
            </h3>
            <p className="text-sm text-neutral-400 font-light leading-relaxed">
              Available for editorial assignments, portraits, and commercial campaigns in Accra and worldwide.
            </p>
          </div>
          <button
            onClick={onBookShoot}
            className="px-8 py-3.5 bg-transparent border border-neutral-600 hover:border-white text-white text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all duration-300 min-h-[44px] shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            Inquire for Commission
          </button>
        </motion.div>
      )}
    </div>
  );
};
