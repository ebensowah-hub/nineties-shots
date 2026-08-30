import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PortfolioItem } from '../types';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  MapPin, 
  Calendar, 
  Camera, 
  Sliders, 
  Download,
  Share2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LightboxProps {
  items: PortfolioItem[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onNavigate
}) => {
  const [showMetadata, setShowMetadata] = useState(true);
  const [copied, setCopied] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const currentItem = items[currentIndex];
  const total = items.length;

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    onNavigate((currentIndex + 1) % total);
  }, [currentIndex, total, onNavigate]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    onNavigate((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onNavigate]);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrev();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowMetadata(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, handleNext, handlePrev]);

  // Mobile swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (diffX > minSwipeDistance) {
      handleNext();
    } else if (diffX < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleShare = async () => {
    if (!currentItem) return;
    const shareData = {
      title: `${currentItem.title} — NINETIES SHOTS`,
      text: currentItem.description || `Viewing ${currentItem.title} by NINETIES SHOTS`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !currentItem) return null;

  const formattedIndex = String(currentIndex + 1).padStart(2, '0');
  const formattedTotal = String(total).padStart(2, '0');

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Photo viewer: ${currentItem.title}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-[#060606]/98 backdrop-blur-md flex flex-col justify-between select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top bar header */}
        <div className="w-full px-6 py-5 flex items-center justify-between border-b border-neutral-900/80 bg-[#060606]/60 backdrop-blur-sm z-20">
          <div className="flex items-center gap-4">
            <span className="font-heading tracking-[0.2em] text-xs font-semibold text-neutral-300 uppercase">
              NINETIES SHOTS
            </span>
            <span className="text-neutral-700">/</span>
            <span className="text-xs font-mono tracking-widest text-neutral-400">
              {formattedIndex} <span className="text-neutral-600">/</span> {formattedTotal}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMetadata(prev => !prev)}
              aria-label="Toggle photograph details"
              className={`p-2.5 transition-colors border ${
                showMetadata 
                  ? 'text-white border-neutral-600 bg-neutral-900' 
                  : 'text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
              title="Toggle details [Key: I]"
            >
              <Info className="w-4 h-4" />
            </button>

            <button
              onClick={handleShare}
              aria-label="Share photograph link"
              className="p-2.5 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700 transition-colors"
              title="Share"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              aria-label="Close image viewer"
              className="p-2.5 text-neutral-400 border border-neutral-800 hover:text-white hover:border-white transition-colors"
              title="Close [Esc]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main image stage */}
        <div className="relative flex-1 w-full flex items-center justify-center p-4 md:p-8 overflow-hidden">
          {/* Previous navigation button */}
          {total > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous photograph"
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 text-neutral-400 hover:text-white bg-black/40 hover:bg-neutral-900/90 border border-neutral-800/80 transition-all z-20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next navigation button */}
          {total > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next photograph"
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 text-neutral-400 hover:text-white bg-black/40 hover:bg-neutral-900/90 border border-neutral-800/80 transition-all z-20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Photograph render */}
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <motion.img
              key={currentItem.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              src={currentItem.image}
              alt={currentItem.alt || currentItem.title}
              className="max-h-[75vh] md:max-h-[82vh] max-w-[92vw] md:max-w-[85vw] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {/* Bottom bar & metadata drawer */}
        <AnimatePresence>
          {showMetadata && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
              className="w-full px-6 py-4 border-t border-neutral-900 bg-[#060606]/90 backdrop-blur-md z-20"
            >
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase bg-neutral-900 px-2 py-0.5 border border-neutral-800">
                      {currentItem.categoryLabel}
                    </span>
                    {currentItem.location && (
                      <span className="text-xs text-neutral-400 font-mono inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-500" />
                        {currentItem.location}
                      </span>
                    )}
                    {currentItem.date && (
                      <span className="text-xs text-neutral-400 font-mono inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        {currentItem.date}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg md:text-xl font-heading font-medium text-white tracking-wide">
                    {currentItem.title}
                  </h2>
                  {currentItem.description && (
                    <p className="text-xs md:text-sm text-neutral-400 font-light leading-relaxed">
                      {currentItem.description}
                    </p>
                  )}
                </div>

                {/* Camera EXIF / Technical specifications */}
                {currentItem.cameraSettings && (
                  <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 bg-neutral-950/80 p-3 border border-neutral-800/80">
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <Camera className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{currentItem.cameraSettings.camera}</span>
                    </div>
                    {currentItem.cameraSettings.lens && (
                      <span className="text-neutral-500 hidden sm:inline">•</span>
                    )}
                    {currentItem.cameraSettings.lens && (
                      <span className="hidden sm:inline">{currentItem.cameraSettings.lens}</span>
                    )}
                    {currentItem.cameraSettings.aperture && (
                      <span className="text-neutral-500">•</span>
                    )}
                    {currentItem.cameraSettings.aperture && (
                      <span>{currentItem.cameraSettings.aperture}</span>
                    )}
                    {currentItem.cameraSettings.shutter && (
                      <span className="text-neutral-500">•</span>
                    )}
                    {currentItem.cameraSettings.shutter && (
                      <span>{currentItem.cameraSettings.shutter}</span>
                    )}
                    {currentItem.cameraSettings.iso && (
                      <span className="text-neutral-500">•</span>
                    )}
                    {currentItem.cameraSettings.iso && (
                      <span>{currentItem.cameraSettings.iso}</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
