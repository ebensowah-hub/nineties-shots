import React from 'react';
import { PortfolioItem } from '../types';
import { ImageWithFallback } from './ImageWithFallback';
import { MapPin, Calendar, Maximize2 } from 'lucide-react';

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
  const getAspectClass = () => {
    switch (layoutVariant) {
      case 'editorial-large':
        return 'aspect-[4/5] md:aspect-[3/4]';
      case 'editorial-wide':
        return 'aspect-[16/10]';
      case 'editorial-tall':
        return 'aspect-[3/5] md:aspect-[2/3]';
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
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      data-cursor="VIEW"
      className="group relative block w-full overflow-hidden bg-neutral-950 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white transition-all duration-500 text-left"
      aria-label={`View photograph: ${item.title}`}
    >
      <div className={`relative w-full overflow-hidden ${getAspectClass()}`}>
        <ImageWithFallback
          src={item.image}
          thumbnail={item.thumbnail}
          alt={item.alt || item.title}
          priority={priority}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />

        {/* Minimalist gradient vignette for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Hover metadata & caption reveal */}
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 flex flex-col justify-end transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] tracking-[0.25em] text-neutral-300 uppercase font-mono">
                {item.categoryLabel}
              </span>
              <h3 className="text-lg md:text-xl font-heading font-medium text-white tracking-wide">
                {item.title}
              </h3>
            </div>
            
            <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center text-white/90 group-hover:border-white transition-colors">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {(item.location || item.date) && (
            <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400 font-mono">
              {item.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-500" />
                  {item.location}
                </span>
              )}
              {item.date && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-neutral-500" />
                  {item.date}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subtle static category tag visible before hover */}
        <div className="absolute top-4 left-4 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
          <span className="px-2.5 py-1 bg-black/60 backdrop-blur-sm text-[9px] font-mono tracking-widest uppercase text-neutral-300 border border-neutral-800/80">
            {item.categoryLabel}
          </span>
        </div>
      </div>

      {/* Mobile-friendly static caption underneath for accessibility & small screens */}
      <div className="pt-3 pb-2 px-1 flex md:hidden items-start justify-between">
        <div>
          <h4 className="text-sm font-heading font-medium text-neutral-200">{item.title}</h4>
          {item.location && <p className="text-[11px] text-neutral-500 font-mono">{item.location}</p>}
        </div>
        <span className="text-[9px] font-mono tracking-wider uppercase text-neutral-400">
          {item.categoryLabel}
        </span>
      </div>
    </div>
  );
};
