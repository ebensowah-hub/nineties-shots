import React, { useState } from 'react';
import { siteConfig } from '../data/siteConfig';
import { MessageSquare, X } from 'lucide-react';

export const WhatsAppFloatingButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Return early if no WhatsApp number is configured
  if (!siteConfig.contact.whatsappNumber) return null;

  const cleanNumber = siteConfig.contact.whatsappNumber.replace(/[^0-9]/g, '');
  const text = encodeURIComponent(siteConfig.contact.whatsappDefaultMessage);
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${text}`;

  return (
    <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
      {/* Optional contextual pop-in tooltip */}
      {showTooltip && (
        <div className="hidden sm:flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-white text-xs font-mono px-3.5 py-2 shadow-2xl animate-fade-in">
          <span>Inquire directly on WhatsApp</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowTooltip(false);
            }}
            className="text-neutral-500 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* WhatsApp Action Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        aria-label="Direct WhatsApp inquiry"
        className="w-12 h-12 bg-neutral-900/90 hover:bg-emerald-950/80 border border-neutral-800 hover:border-emerald-700/80 text-emerald-400 flex items-center justify-center shadow-2xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 group outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
      >
        <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
      </a>
    </div>
  );
};
