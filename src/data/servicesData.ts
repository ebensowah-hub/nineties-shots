import { ServiceItem } from '../types';

export const servicesData: ServiceItem[] = [
  {
    id: 'portraits',
    title: 'Editorial & Studio Portraits',
    category: 'portraits',
    tagline: 'High-character individual, creative, and executive portraiture.',
    description: 'A dedicated studio or environmental portrait session designed to distill personality, quiet poise, and distinctive personal branding with sculpted lighting and high-contrast styling.',
    highlights: [
      'In-depth pre-shoot creative direction & moodboard consultation',
      'Studio or hand-picked private architectural location',
      'Up to 3 wardrobe looks & intentional lighting setups',
      'Master color grading and skin texture retouching'
    ],
    deliverables: [
      '15 High-Resolution Master Retouched Plates',
      'Private High-Speed Client Proofing Gallery',
      'Full Commercial & Editorial Usage License'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
    priceAmount: 2500,
    quoteRangeText: 'Starting from GH₵2,500'
  },
  {
    id: 'lifestyle',
    title: 'Authentic Lifestyle & Candid Narrative',
    category: 'lifestyle',
    tagline: 'Documentary-style visual storytelling in kinetic environments.',
    description: 'Immersive lifestyle documentation capturing real human energy, contemporary culture, and organic moments for artists, founders, and lifestyle brands seeking unforced authenticity.',
    highlights: [
      'On-location natural light & atmospheric strobe sculpting',
      'Half-day or full-day immersive documentation',
      'Dynamic framing in urban or coastal environments',
      'Film-inspired color grading with rich tonal contrast'
    ],
    deliverables: [
      '35+ Curated High-Resolution Editorial Edits',
      'Full Digital Image Archive for Social & Web',
      'Rapid 72-hour Turnaround for Selected Press Cuts'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
    priceAmount: 3500,
    quoteRangeText: 'Starting from GH₵3,500'
  },
  {
    id: 'photo-shoots',
    title: 'Creative Campaigns & Photo Shoots',
    category: 'photo-shoots',
    tagline: 'Full-concept editorial lookbooks, campaigns, and commercial briefs.',
    description: 'End-to-end creative production for fashion labels, musical artists, and visionary publications requiring bold art direction, multi-set staging, and museum-grade visual impact.',
    highlights: [
      'Comprehensive concept development & art direction deck',
      'Full lighting crew, tethered capture & live monitor review',
      'Multi-model or complex set coordination support',
      'Bespoke high-end retouches with archival medium-format files'
    ],
    deliverables: [
      'Complete Campaign Asset Suite (Print & Web Resolution)',
      'Billboard & Large-Format Ready Master Exports',
      'Perpetual Multi-Market Advertising Rights'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
    priceAmount: 6000,
    quoteRangeText: 'Custom Commission Scoping'
  }
];
