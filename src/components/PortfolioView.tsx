import React, { useState, useMemo } from 'react';
import { PortfolioItem, CategorySlug } from '../types';
import { portfolioCategories } from '../data/siteConfig';
import { PortfolioCard } from './PortfolioCard';
import { SectionHeading } from './SectionHeading';
import { LayoutGrid, Grid3X3, SlidersHorizontal, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cinematicEase } from '../lib/motion';

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
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug>(initialCategory);
  const [layoutMode, setLayoutMode] = useState<'editorial' | 'grid'>('editorial');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const activeCategoryObj = portfolioCategories.find(c => c.id === selectedCategory);

  return (
    <div className="pt-32 pb-32 px-6 md:px-10 max-w-7xl mx-auto min-h-screen">
      <SectionHeading
        number="02"
        tag="Gallery & Archive"
        title="Portfolio"
        subtitle={activeCategoryObj?.description || 'Browse high-resolution photographs organized by photographic discipline.'}
      />

      {/* Category Navigation Pills & Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 mb-10 border-b border-neutral-900">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {portfolioCategories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap border ${
                  isSelected
                    ? 'bg-white text-black border-white font-semibold'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] ${isSelected ? 'text-neutral-600' : 'text-neutral-500'}`}>
                  ({String(count).padStart(2, '0')})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Layout View Switcher */}
        <div className="flex items-center justify-between gap-3 w-full lg:w-auto">
          {/* Search box */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search frames..."
              className="bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-2 sm:py-1.5 text-base sm:text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 w-full sm:w-48 font-mono"
            />
          </div>

          {/* Layout switch buttons */}
          <div className="flex items-center border border-neutral-800 bg-neutral-950 p-0.5 shrink-0">
            <button
              onClick={() => setLayoutMode('editorial')}
              aria-label="Editorial Layout"
              title="Editorial Asymmetric Layout"
              className={`p-2 sm:p-1.5 transition-colors min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                layoutMode === 'editorial' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              aria-label="Uniform Grid Layout"
              title="Uniform 3-Column Grid"
              className={`p-2 sm:p-1.5 transition-colors min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0 flex items-center justify-center ${
                layoutMode === 'grid' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Render */}
      {filteredItems.length === 0 ? (
        <div className="py-24 text-center border border-neutral-900 bg-neutral-950/40 p-12">
          <p className="text-lg font-heading text-neutral-300 uppercase tracking-widest">No Frames Found</p>
          <p className="text-sm text-neutral-500 font-mono mt-2">
            No photographs match your current filter or query &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-6 px-6 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-xs font-mono uppercase tracking-wider text-neutral-200"
          >
            Reset Filters
          </button>
        </div>
      ) : layoutMode === 'grid' ? (
        /* Uniform Grid */
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          <AnimatePresence>
            {filteredItems.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: cinematicEase }}
              >
                <PortfolioCard
                  item={item}
                  onClick={() => onOpenLightbox(item)}
                  layoutVariant="standard"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Editorial Staggered Layout */
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-start"
        >
          <AnimatePresence>
            {filteredItems.map((item, index) => {
              // Stagger columns: alternate wide, tall, standard
              let colSpan = 'md:col-span-6';
              let variant: 'standard' | 'editorial-large' | 'editorial-wide' | 'editorial-tall' = 'standard';

              if (index % 5 === 0) {
                colSpan = 'md:col-span-8 md:col-start-1';
                variant = 'editorial-wide';
              } else if (index % 5 === 1) {
                colSpan = 'md:col-span-4';
                variant = 'editorial-tall';
              } else if (index % 5 === 2) {
                colSpan = 'md:col-span-5 md:col-start-2';
                variant = 'editorial-large';
              } else if (index % 5 === 3) {
                colSpan = 'md:col-span-5';
                variant = 'editorial-large';
              } else {
                colSpan = 'md:col-span-6';
                variant = 'standard';
              }

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, delay: Math.min(index * 0.03, 0.2), ease: cinematicEase }}
                  className={colSpan}
                >
                  <PortfolioCard
                    item={item}
                    onClick={() => onOpenLightbox(item)}
                    layoutVariant={variant}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Editorial Conversion / Commission Callout */}
      {onBookShoot && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, ease: cinematicEase }}
          className="mt-16 sm:mt-24 p-6 sm:p-10 md:p-12 border border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left"
        >
          <div className="space-y-1 max-w-xl">
            <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase block">
              COMMISSION AN ARCHIVE
            </span>
            <h3 className="text-xl sm:text-2xl font-heading uppercase text-white tracking-wide">
              Ready to create something remarkable?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 font-light leading-relaxed">
              Accepting editorial portraits, authentic lifestyle narratives, and creative campaigns for 2026.
            </p>
          </div>
          <button
            onClick={onBookShoot}
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors whitespace-nowrap min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            Commission a Shoot
          </button>
        </motion.div>
      )}
    </div>
  );
};
