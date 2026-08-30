import React, { useState, useMemo } from 'react';
import { PortfolioItem, CategorySlug } from '../types';
import { portfolioCategories } from '../data/siteConfig';
import { PortfolioCard } from './PortfolioCard';
import { SectionHeading } from './SectionHeading';
import { LayoutGrid, Grid3X3, SlidersHorizontal, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PortfolioViewProps {
  items: PortfolioItem[];
  initialCategory?: CategorySlug;
  onOpenLightbox: (item: PortfolioItem) => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  items,
  initialCategory = 'all',
  onOpenLightbox
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
        <div className="flex items-center gap-3 self-end lg:self-center">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search frames..."
              className="bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 w-36 sm:w-48 font-mono"
            />
          </div>

          {/* Layout switch buttons */}
          <div className="flex items-center border border-neutral-800 bg-neutral-950 p-0.5">
            <button
              onClick={() => setLayoutMode('editorial')}
              aria-label="Editorial Layout"
              title="Editorial Asymmetric Layout"
              className={`p-1.5 transition-colors ${
                layoutMode === 'editorial' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayoutMode('grid')}
              aria-label="Uniform Grid Layout"
              title="Uniform 3-Column Grid"
              className={`p-1.5 transition-colors ${
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
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
    </div>
  );
};
