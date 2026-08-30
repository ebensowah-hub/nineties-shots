import React from 'react';
import { aboutData } from '../data/aboutData';
import { photographerPortrait } from '../data/portfolioData';
import { SectionHeading } from './SectionHeading';
import { ImageWithFallback } from './ImageWithFallback';
import { Quote, Eye, Flame, ShieldCheck, Compass } from 'lucide-react';

interface AboutViewProps {
  onBookShoot?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBookShoot }) => {
  const getPillarIcon = (index: number) => {
    switch (index) {
      case 0: return <Eye className="w-5 h-5 text-neutral-400" />;
      case 1: return <Flame className="w-5 h-5 text-neutral-400" />;
      case 2: return <ShieldCheck className="w-5 h-5 text-neutral-400" />;
      default: return <Compass className="w-5 h-5 text-neutral-400" />;
    }
  };

  return (
    <div className="pt-32 pb-32 px-6 md:px-10 max-w-7xl mx-auto min-h-screen">
      <SectionHeading
        number="03"
        tag="Creative Philosophy"
        title="About"
        subtitle="The ethos, vision, and human presence behind NINETIES SHOTS."
      />

      {/* Hero Manifesto Quote */}
      <div className="mb-20 md:mb-28 max-w-4xl">
        <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-neutral-500 mb-4 block">
          THE ETHOS
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-heading font-light text-white tracking-tight leading-[1.1] uppercase">
          {aboutData.headline}
        </h2>
        <p className="mt-6 text-lg sm:text-xl text-neutral-400 font-light leading-relaxed">
          {aboutData.intro}
        </p>
      </div>

      {/* Grid: Story Narrative & Photographer Portrait Frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-28">
        {/* Story Text Column */}
        <div className="lg:col-span-7 space-y-8 text-neutral-300 font-light text-base md:text-lg leading-relaxed">
          <div className="p-8 border border-neutral-800 bg-neutral-950/60 relative">
            <Quote className="w-8 h-8 text-neutral-700 mb-4" />
            <p className="text-xl md:text-2xl font-serif italic text-white leading-snug">
              {aboutData.photographerNotes.statement}
            </p>
            <div className="mt-4 pt-4 border-t border-neutral-900 flex items-center justify-between text-xs font-mono text-neutral-400">
              <span>NINETIES SHOTS</span>
              <span>{aboutData.photographerNotes.role}</span>
            </div>
          </div>

          <div className="space-y-6 pt-4">
            <h3 className="text-xl font-heading uppercase text-white tracking-wide">
              The Journey & Discipline
            </h3>
            {aboutData.story.map((paragraph, idx) => (
              <p key={idx} className="text-neutral-400">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="pt-6 border-t border-neutral-900">
            <h4 className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">
              EQUIPMENT & CRAFT ETHOS
            </h4>
            <p className="text-sm text-neutral-400 font-mono">
              {aboutData.photographerNotes.equipmentEthos}
            </p>
          </div>
        </div>

        {/* Photographer Portrait Frame (Replaceable) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative group border border-neutral-800/80 bg-neutral-950 p-3">
            <ImageWithFallback
              src={photographerPortrait.url}
              alt={photographerPortrait.alt}
              className="w-full aspect-[3/4] object-cover filter contrast-[1.05]"
            />
            <div className="mt-3 px-2 py-1 flex items-center justify-between text-[11px] font-mono text-neutral-500">
              <span>BEHIND THE LENS</span>
              <span>EST. 2026</span>
            </div>
          </div>
          <p className="text-xs text-neutral-500 font-mono text-center">
            Commission inquiries worldwide: Studio & on-location.
          </p>
        </div>
      </div>

      {/* 4 Creative Philosophy Pillars */}
      <div className="mb-24">
        <div className="mb-10">
          <span className="text-[11px] font-mono tracking-[0.25em] text-neutral-500 uppercase">
            METHODOLOGY
          </span>
          <h3 className="text-2xl sm:text-3xl font-heading text-white uppercase tracking-tight mt-1">
            The Four Tenets
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {aboutData.creativePhilosophy.map((pillar, idx) => (
            <div
              key={pillar.title}
              className="p-6 md:p-8 bg-neutral-950/80 border border-neutral-800/80 flex flex-col justify-between hover:border-neutral-600 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  {getPillarIcon(idx)}
                  <span className="text-xs font-mono text-neutral-600">0{idx + 1}</span>
                </div>
                <h4 className="text-lg font-heading text-white uppercase tracking-wider mb-1">
                  {pillar.title}
                </h4>
                <p className="text-xs text-neutral-400 font-mono mb-4">
                  {pillar.subtitle}
                </p>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed font-light">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* About CTA */}
      {onBookShoot && (
        <div className="p-8 md:p-12 border border-neutral-800 bg-neutral-950 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-2xl font-heading uppercase text-white tracking-wide">
              Have a Project or Commission in Mind?
            </h3>
            <p className="text-sm text-neutral-400 font-mono mt-1">
              Currently reviewing creative briefs and commission dates for 2026.
            </p>
          </div>
          <button
            onClick={onBookShoot}
            className="px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors whitespace-nowrap"
          >
            Start a Conversation
          </button>
        </div>
      )}
    </div>
  );
};
