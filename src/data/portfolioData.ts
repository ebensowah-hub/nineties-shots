import { PortfolioItem } from '../types';

/**
 * =====================================================================
 * NINETIES SHOTS — PORTFOLIO DATA ARCHITECTURE
 * =====================================================================
 * This file is the centralized single source of truth for all photographs.
 * Replacing placeholder images with the photographer's real work is done
 * simply by updating the image URLs, titles, and metadata in this array.
 */

export const portfolioItems: PortfolioItem[] = [
  // 1. PHOTO SHOOTS
  {
    id: 'shot-01',
    title: 'Monochrome Velocity',
    category: 'photo-shoots',
    categoryLabel: 'Photo Shoots',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    alt: 'Commissioned fashion photo shoot in high contrast lighting',
    location: 'Paris, France',
    date: 'Spring 2026',
    description: 'An exploration of silhouette and sharp shadows in brutalist architectural settings for a commissioned concept shoot.',
    featured: true,
    orientation: 'portrait',
    aspectRatio: '4/5',
    cameraSettings: {
      camera: 'Leica M11-P',
      lens: 'Summilux-M 35mm f/1.4',
      aperture: 'f/2.0',
      shutter: '1/500s',
      iso: 'ISO 100'
    }
  },
  {
    id: 'shot-02',
    title: 'Concrete Mirage',
    category: 'photo-shoots',
    categoryLabel: 'Photo Shoots',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800',
    alt: 'Creative photo shoot model posing against dramatic concrete forms',
    location: 'Milan, Italy',
    date: '2026',
    description: 'Sculptural silhouettes meeting industrial geometry in a commissioned creative photo shoot.',
    featured: true,
    orientation: 'portrait',
    aspectRatio: '4/5',
    cameraSettings: {
      camera: 'Hasselblad X2D 100C',
      lens: 'XCD 55mm f/2.5 V',
      aperture: 'f/2.8',
      shutter: '1/800s',
      iso: 'ISO 64'
    }
  },

  // 2. PORTRAITS
  {
    id: 'shot-03',
    title: 'Gaze into the Low Sun',
    category: 'portraits',
    categoryLabel: 'Portraits',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    alt: 'Cinematic male portrait captured in low golden rake lighting',
    location: 'SoHo, New York',
    date: '2026',
    description: 'Direct, unfiltered character portrait focusing on micro-expressions and authentic skin texture.',
    featured: true,
    orientation: 'portrait',
    aspectRatio: '4/5',
    cameraSettings: {
      camera: 'Canon EOS R5',
      lens: 'RF 50mm f/1.2 L USM',
      aperture: 'f/1.4',
      shutter: '1/1000s',
      iso: 'ISO 200'
    }
  },
  {
    id: 'shot-04',
    title: 'Neon Drift & Stillness',
    category: 'portraits',
    categoryLabel: 'Portraits',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800',
    alt: 'Atmospheric natural portrait with subtle night ambiance',
    location: 'Tokyo, Japan',
    date: '2026',
    description: 'Documenting youth culture and nocturnal presence in the back-alleys of Shibuya.',
    featured: false,
    orientation: 'portrait',
    aspectRatio: '4/5',
    cameraSettings: {
      camera: 'Sony A1',
      lens: 'FE 85mm f/1.4 GM',
      aperture: 'f/1.6',
      shutter: '1/250s',
      iso: 'ISO 800'
    }
  },
  {
    id: 'shot-05',
    title: 'Apex of the Turn',
    category: 'photo-shoots',
    categoryLabel: 'Photo Shoots',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&q=80&w=800',
    alt: 'High-speed motion photo shoot frozen in dramatic stadium lighting',
    location: 'London, UK',
    date: '2026',
    description: 'Raw kinetic tension frozen at 1/4000th of a second during a commissioned motion photo shoot.',
    featured: true,
    orientation: 'landscape',
    aspectRatio: '16/10',
    cameraSettings: {
      camera: 'Sony A9 III',
      lens: 'FE 300mm f/2.8 GM OSS',
      aperture: 'f/2.8',
      shutter: '1/4000s',
      iso: 'ISO 400'
    }
  },
  {
    id: 'shot-06',
    title: 'Midnight Boxer',
    category: 'portraits',
    categoryLabel: 'Portraits',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80&w=800',
    alt: 'Boxer wrapped in heavy shadows in a gritty training gym portrait',
    location: 'Brooklyn, New York',
    date: '2026',
    description: 'Pre-fight concentration behind heavy leather ropes. Emphasizing raw discipline, character, and grain.',
    featured: false,
    orientation: 'portrait',
    aspectRatio: '4/5',
    cameraSettings: {
      camera: 'Leica SL2-S',
      lens: 'APO-Summicron-SL 50mm f/2',
      aperture: 'f/2.0',
      shutter: '1/640s',
      iso: 'ISO 1600'
    }
  },

  // 3. LIFESTYLE & PHOTO SHOOTS
  {
    id: 'shot-07',
    title: 'Subterranean Frequency',
    category: 'photo-shoots',
    categoryLabel: 'Photo Shoots',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
    alt: 'Creative photo shoot session bathed in dramatic strobe and smoke beams',
    location: 'Berlin, Germany',
    date: '2026',
    description: 'Immersion inside the sonic wave. Capturing atmospheric light and motion in an underground creative session.',
    featured: true,
    orientation: 'landscape',
    aspectRatio: '16/10',
    cameraSettings: {
      camera: 'Canon EOS R5',
      lens: 'RF 28-70mm f/2 L USM',
      aperture: 'f/2.0',
      shutter: '1/320s',
      iso: 'ISO 3200'
    }
  },
  {
    id: 'shot-08',
    title: 'Afterparty Backstage',
    category: 'lifestyle',
    categoryLabel: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    alt: 'Candid lifestyle gathering with golden sparklers and motion blur',
    location: 'London, UK',
    date: '2026',
    description: 'Unrehearsed human connection in the quiet spaces between headline acts.',
    featured: false,
    orientation: 'portrait',
    aspectRatio: '4/5',
    cameraSettings: {
      camera: 'Sony A7R V',
      lens: 'FE 35mm f/1.4 GM',
      aperture: 'f/1.8',
      shutter: '1/200s',
      iso: 'ISO 1250'
    }
  },
  {
    id: 'shot-09',
    title: 'Boulevard of Shadows',
    category: 'lifestyle',
    categoryLabel: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    alt: 'Atmospheric night city scene with silhouettes and vintage vehicle',
    location: 'Los Angeles, California',
    date: '2026',
    description: 'Dusk settling over concrete avenues. The timeless allure of West Coast nocturnal movement.',
    featured: true,
    orientation: 'landscape',
    aspectRatio: '16/9',
    cameraSettings: {
      camera: 'Fujifilm GFX 100 II',
      lens: 'GF 45mm f/2.8 R WR',
      aperture: 'f/3.2',
      shutter: '1/160s',
      iso: 'ISO 640'
    }
  },
  {
    id: 'shot-10',
    title: 'Rain on Raw Silk',
    category: 'lifestyle',
    categoryLabel: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
    alt: 'Candid lifestyle moment on wet urban cobblestones',
    location: 'Copenhagen, Denmark',
    date: '2026',
    description: 'Unplanned Scandinavian morning light bouncing off modern tailoring and wet asphalt.',
    featured: false,
    orientation: 'portrait',
    aspectRatio: '4/5',
    cameraSettings: {
      camera: 'Leica Q3',
      lens: 'Summilux 28mm f/1.7 ASPH',
      aperture: 'f/2.2',
      shutter: '1/800s',
      iso: 'ISO 200'
    }
  },
  {
    id: 'shot-11',
    title: 'Grain Study No. 04',
    category: 'photo-shoots',
    categoryLabel: 'Photo Shoots',
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800',
    alt: 'Abstract film grain light experimentation photo shoot',
    location: 'Studio Darkroom',
    date: '2026',
    description: 'Analog emulsion manipulation and double-exposure studies during a creative studio photo shoot session.',
    featured: true,
    orientation: 'square',
    aspectRatio: '1/1',
    cameraSettings: {
      camera: 'Hasselblad 500C/M (35mm Film Back)',
      lens: 'Planar 80mm f/2.8',
      aperture: 'f/4.0',
      shutter: '1/125s',
      iso: 'Kodak Tri-X 400'
    }
  },
  {
    id: 'shot-12',
    title: 'Silent Resonance',
    category: 'lifestyle',
    categoryLabel: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=90&w=2400',
    thumbnail: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&q=80&w=800',
    alt: 'Moody silhouette and atmospheric shadow play',
    location: 'Reykjavik, Iceland',
    date: '2026',
    description: 'Subtle gradients between absolute black and northern twilight across volcanic rock.',
    featured: false,
    orientation: 'landscape',
    aspectRatio: '16/9',
    cameraSettings: {
      camera: 'Leica M11 Monochrom',
      lens: 'Apo-Summicron-M 50mm f/2',
      aperture: 'f/2.8',
      shutter: '1/400s',
      iso: 'ISO 125'
    }
  }
];

export const heroImage = {
  url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=95&w=2600',
  thumbnail: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800',
  alt: 'NINETIES SHOTS — Signature cinematic photograph with atmospheric contrast and human presence'
};

export const photographerPortrait = {
  url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=90&w=1600',
  alt: 'NINETIES SHOTS — Behind the lens portrait'
};
