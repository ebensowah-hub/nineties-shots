import React from 'react';
import { PortfolioItem, CategorySlug } from '../types';
import { PortfolioCard } from './PortfolioCard';
import { SectionHeading } from './SectionHeading';
import { ArrowRight } from 'lucide-react';

interface SelectedWorkProps {
  items: PortfolioItem[];
  onOpenLightbox: (item: PortfolioItem) => void;
  onExploreAll: (category?: CategorySlug) => void;
}

export const SelectedWork: React.FC<SelectedWorkProps> = ({
  items,
  onOpenLightbox,
  onExploreAll
}) => {
  // Select featured items or pick first 6 curated items
  const selectedItems = items.slice(0, 6);

  return (
    <section id="selected-work" className="py-24 md:py-32 px-6 md:px-10 max-w-7xl mx-auto">
      <SectionHeading
        number="01"
        tag="Curated Portfolio"
        title="Selected Work"
        subtitle="A collection of decisive moments, raw athletic kineticism, and high-fashion editorial narratives."
        align="between"
      >
        <button
          onClick={() => onExploreAll('all')}
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-neutral-300 hover:text-white pb-1 border-b border-neutral-700 hover:border-white transition-all group"
        >
          <span>View Full Archive</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </SectionHeading>

      {/* Editorial Asymmetrical Composition Grid */}
      <div className="space-y-10 md:space-y-16">
        {/* Row 1: 1 Hero Wide/Large Image & 1 Tall Portrait */}
        {selectedItems.length >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-end">
            <div className="lg:col-span-7">
              <PortfolioCard
                item={selectedItems[0]}
                onClick={() => onOpenLightbox(selectedItems[0])}
                layoutVariant="editorial-wide"
                priority
              />
            </div>
            <div className="lg:col-span-5 lg:mb-8">
              <PortfolioCard
                item={selectedItems[1]}
                onClick={() => onOpenLightbox(selectedItems[1])}
                layoutVariant="editorial-tall"
              />
            </div>
          </div>
        )}

        {/* Row 2: 2 Balanced Editorial Images with Offset Spacing */}
        {selectedItems.length >= 4 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            <div className="md:col-span-5 md:col-start-2">
              <PortfolioCard
                item={selectedItems[2]}
                onClick={() => onOpenLightbox(selectedItems[2])}
                layoutVariant="editorial-large"
              />
            </div>
            <div className="md:col-span-5 md:col-start-8">
              <PortfolioCard
                item={selectedItems[3]}
                onClick={() => onOpenLightbox(selectedItems[3])}
                layoutVariant="editorial-large"
              />
            </div>
          </div>
        )}

        {/* Row 3: Wide Cinematic Anchor Image */}
        {selectedItems.length >= 5 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
            <div className="lg:col-span-8 lg:col-start-3">
              <PortfolioCard
                item={selectedItems[4]}
                onClick={() => onOpenLightbox(selectedItems[4])}
                layoutVariant="editorial-wide"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Exploration CTA */}
      <div className="mt-16 pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <p className="text-sm font-mono text-neutral-400">
          Showing 06 curated works from our active 2026 gallery.
        </p>
        <button
          onClick={() => onExploreAll('all')}
          className="px-8 py-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-500 hover:bg-neutral-800 text-xs uppercase font-bold tracking-[0.2em] text-white transition-all"
        >
          Explore All Categories & Works
        </button>
      </div>
    </section>
  );
};
