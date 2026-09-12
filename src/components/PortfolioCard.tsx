import React from 'react';
import { PortfolioItem } from '../types';
import { ImageWithFallback } from './ImageWithFallback';
import { motion } from 'motion/react';
import { useCinematicMotion } from '../lib/motion';

interface PortfolioCardProps {
  item: PortfolioItem;
  onClick: () => void;
  layoutVariant?: 'standard' | 'editorial-large' | 'editorial-wide' | 'editorial-tall';
  priority?: boolean;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  item,
  onClick,
  layoutVariant = 'standard',
  priority = false
}) => {
  const { reduceMotion, cinematicEase } = useCinematicMotion();

  const getAspectClass = () => {
    switch (layoutVariant) {
      case 'editorial-large':
        return 'aspect-[4/5] md:aspect-[4/5]';
      case 'editorial-wide':
        return 'aspect-[16/10] md:aspect-[16/9]';
      case 'editorial-tall':
        return 'aspect-[3/4] md:aspect-[2/3]';
      default:
        return item.orientation === 'landscape' ? 'aspect-[16/10]' : item.orientation === 'square' ? 'aspect-square' : 'aspect-[4/5]';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: reduceMotion ? 0 : 0.7, ease: cinematicEase }}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      data-cursor="VIEW"
      className="group relative block w-full bg-transparent cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-white text-left"
      aria-label={`View photograph: ${item.title}`}
    >
      <div className={`relative w-full overflow-hidden bg-neutral-950 ${getAspectClass()}`}>
        <ImageWithFallback
          src={item.image}
          thumbnail={item.thumbnail}
          alt={item.alt || item.title}
          priority={priority}
          className="w-full h-full object-cover transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
        />

        {/* Cinematic dark subtle vignette on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* Editorial Caption Underneath - High Fashion & Quiet Luxury */}
      <div className="pt-3.5 pb-1 flex items-baseline justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-sm md:text-base font-heading font-medium text-neutral-200 group-hover:text-white transition-colors">
            {item.title}
          </h3>
          {item.location && (
            <p className="text-[11px] text-neutral-500 font-mono tracking-wider">
              {item.location}
            </p>
          )}
        </div>
        <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-neutral-500 group-hover:text-neutral-300 transition-colors shrink-0">
          {item.categoryLabel}
        </span>
      </div>
    </motion.div>
  );
};
