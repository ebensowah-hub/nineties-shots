import React from 'react';
import { servicesData } from '../data/servicesData';
import { SectionHeading } from './SectionHeading';
import { ImageWithFallback } from './ImageWithFallback';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

interface ServicesViewProps {
  onRequestQuote: (serviceTitle: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({ onRequestQuote }) => {
  return (
    <div className="pt-32 pb-32 px-6 md:px-10 max-w-7xl mx-auto min-h-screen">
      <SectionHeading
        number="04"
        tag="Creative Offerings"
        title="Services"
        subtitle="Photography services focused on Portraits, Lifestyle, and commissioned Photo Shoots."
      />

      {/* Services List with Editorial Cards */}
      <div className="space-y-20 md:space-y-28">
        {servicesData.map((service, index) => {
          const isReversed = index % 2 === 1;

          return (
            <div
              key={service.id}
              id={`service-${service.id}`}
              className="border-t border-neutral-900 pt-12 md:pt-16"
            >
              <div className={`grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center ${
                isReversed ? 'lg:grid-flow-dense' : ''
              }`}>
                {/* Visual Preview */}
                <div className={`lg:col-span-5 ${isReversed ? 'lg:col-start-8' : ''}`}>
                  <div className="relative group overflow-hidden border border-neutral-800 bg-neutral-950">
                    <ImageWithFallback
                      src={service.sampleImage}
                      alt={`NINETIES SHOTS — ${service.title}`}
                      className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-2.5 py-1 bg-black/70 text-[9px] font-mono uppercase tracking-widest text-neutral-300 border border-neutral-800">
                        COMMISSION 0{index + 1}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Details */}
                <div className={`lg:col-span-7 space-y-6 ${isReversed ? 'lg:col-start-1' : ''}`}>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
                      DISCIPLINE // 0{index + 1}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-heading font-medium uppercase text-white tracking-tight">
                      {service.title}
                    </h3>
                    <p className="text-sm font-mono text-neutral-400">
                      {service.tagline}
                    </p>
                  </div>

                  <p className="text-base text-neutral-300 font-light leading-relaxed">
                    {service.description}
                  </p>

                  {/* Highlights Grid */}
                  <div className="pt-2">
                    <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400 block mb-3">
                      SCOPE & HIGHLIGHTS
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {service.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-300 font-light">
                          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <span>{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="p-4 bg-neutral-950/80 border border-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                        DELIVERABLES
                      </span>
                      <p className="text-xs text-neutral-300 font-mono mt-1">
                        {service.deliverables.join(' • ')}
                      </p>
                    </div>

                    <button
                      onClick={() => onRequestQuote(service.title)}
                      className="px-6 py-3 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto"
                    >
                      <span>Request a Quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tailored Inquiries Note */}
      <div className="mt-24 p-8 md:p-12 border border-neutral-800 bg-neutral-950/60 text-center max-w-3xl mx-auto">
        <Sparkles className="w-6 h-6 text-neutral-400 mx-auto mb-3" />
        <h4 className="text-xl font-heading uppercase text-white tracking-wide">
          Bespoke Creative Concepts
        </h4>
        <p className="text-sm text-neutral-400 font-light leading-relaxed mt-2 max-w-xl mx-auto">
          Have a specific location, multi-day concept, or custom creative direction? Every session can be tailored around your aesthetic vision.
        </p>
        <button
          onClick={() => onRequestQuote('Photo Shoots')}
          className="mt-6 px-8 py-3.5 bg-neutral-900 border border-neutral-700 hover:border-white text-xs font-mono uppercase tracking-[0.2em] text-white transition-colors"
        >
          Inquire Custom Photo Shoot
        </button>
      </div>
    </div>
  );
};
