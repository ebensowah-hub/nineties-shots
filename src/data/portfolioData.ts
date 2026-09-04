import { PortfolioItem } from '../types';

export const heroImage = {
  url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop',
  alt: 'NINETIES SHOTS — High-Contrast Editorial Portrait'
};

export const photographerPortrait = {
  url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop',
  alt: 'Lead Photographer & Creative Director — NINETIES SHOTS'
};

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'work-01',
    title: 'Solitude in Monochrome',
    category: 'portraits',
    categoryLabel: 'Portraits',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
    alt: 'Studio portrait of woman with dramatic high key studio lighting',
    location: 'Accra Studio, GH',
    date: '2026-02',
    description: 'Minimalist editorial portrait focusing on facial topography and quiet poise.',
    featured: true,
    orientation: 'portrait',
    aspectRatio: '3/4',
    cameraSettings: {
      camera: 'Hasselblad X2D 100C',
      lens: 'XCD 90mm f/2.5',
      aperture: 'f/2.8',
      shutter: '1/250s',
      iso: '100'
    }
  },
  {
    id: 'work-02',
    title: 'Osu Night Drift',
    category: 'lifestyle',
    categoryLabel: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=600&auto=format&fit=crop',
    alt: 'Candid golden hour street portrait in urban context',
    location: 'Osu, Accra',
    date: '2026-01',
    description: 'Documentary glimpse into evening energy and coastal breeze across Oxford Street.',
    featured: true,
    orientation: 'portrait',
    aspectRatio: '3/4',
    cameraSettings: {
      camera: 'Leica Q3',
      lens: 'Summilux 28mm f/1.7',
      aperture: 'f/2.0',
      shutter: '1/500s',
      iso: '400'
    }
  },
  {
    id: 'work-03',
    title: 'Sartorial Vanguard',
    category: 'photo-shoots',
    categoryLabel: 'Photo Shoots',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop',
    alt: 'Avant-garde fashion campaign editorial styling',
    location: 'Labadi Beach Atelier',
    date: '2026-03',
    description: 'Commissioned fashion lookbook harmonizing West African tailoring with brutalist concrete geometry.',
    featured: true,
    orientation: 'portrait',
    aspectRatio: '3/4',
    cameraSettings: {
      camera: 'Fujifilm GFX 100 II',
      lens: 'GF 110mm f/2 R LM WR',
      aperture: 'f/2.5',
      shutter: '1/320s',
      iso: '160'
    }
  },
  {
    id: 'work-04',
    title: 'Gilded Reverie',
    category: 'portraits',
    categoryLabel: 'Portraits',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=600&auto=format&fit=crop',
    alt: 'Warm sun-kissed natural light portrait',
    location: 'Jamestown, Accra',
    date: '2026-01',
    description: 'Golden hour study on warmth, texture, and natural skin glow.',
    featured: false,
    orientation: 'portrait',
    aspectRatio: '3/4',
    cameraSettings: {
      camera: 'Canon EOS R5',
      lens: 'RF 85mm f/1.2L USM',
      aperture: 'f/1.4',
      shutter: '1/1000s',
      iso: '100'
    }
  },
  {
    id: 'work-05',
    title: 'Kinetic Metro Rhythm',
    category: 'lifestyle',
    categoryLabel: 'Lifestyle',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop',
    alt: 'Movement and motion blur urban street life portrait',
    location: 'Airport City, Accra',
    date: '2026-02',
    description: 'Slow-shutter visual cadence capturing modern pace and urban transit.',
    featured: false,
    orientation: 'landscape',
    aspectRatio: '16/10',
    cameraSettings: {
      camera: 'Sony A1',
      lens: 'FE 35mm f/1.4 GM',
      aperture: 'f/4.0',
      shutter: '1/30s',
      iso: '200'
    }
  },
  {
    id: 'work-06',
    title: 'Nocturne Runway Lookbook',
    category: 'photo-shoots',
    categoryLabel: 'Photo Shoots',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=600&auto=format&fit=crop',
    alt: 'High fashion editorial shoot under dramatic night illumination',
    location: 'Independence Square Pavilion',
    date: '2026-03',
    description: 'High-concept directional flash photography for an international capsule collection.',
    featured: true,
    orientation: 'portrait',
    aspectRatio: '3/4',
    cameraSettings: {
      camera: 'Hasselblad X2D 100C',
      lens: 'XCD 55mm f/2.5',
      aperture: 'f/3.2',
      shutter: '1/160s',
      iso: '100'
    }
  }
];
