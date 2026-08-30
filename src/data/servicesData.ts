import { ServiceItem } from '../types';

export const servicesData: ServiceItem[] = [
  {
    id: 'portraits',
    title: 'Portraits',
    category: 'portraits',
    tagline: 'Photography focused on individuals, personal expression, identity and strong visual portraits.',
    description: 'Photography focused on individuals, personal expression, identity and strong visual portraits. We look past stiff corporate poses to uncover genuine presence, micro-expressions, and magnetic character. Every session is relaxed, intentional, and focused on your authentic identity.',
    highlights: [
      'Studio or environmental on-location sessions',
      'Creative lighting tailored to facial architecture',
      'Wardrobe consultation & styling guidance',
      'Natural, non-destructive skin retouching',
      'Private proofing gallery and digital masters'
    ],
    deliverables: [
      'Online selection gallery within 48 hours',
      'Signature hand-graded portrait masters',
      'High-resolution print & web-optimized files'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=90&w=1600'
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    category: 'lifestyle',
    tagline: 'Natural and creative photography capturing personality, atmosphere, movement and everyday moments.',
    description: 'Natural and creative photography capturing personality, atmosphere, movement and everyday moments. We create visual narratives that feel lived-in, unforced, cinematic, and timeless.',
    highlights: [
      'Natural light storytelling & environmental context',
      'Candid, documentary-style movement capture',
      'Travel, urban culture & atmospheric spaces',
      'Subtle film-inspired color grading',
      'Rich multi-frame story sequences'
    ],
    deliverables: [
      'Curated lifestyle story archive',
      'High-resolution graded digital masters',
      'Optimized deliverables for web & print'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=90&w=1600'
  },
  {
    id: 'photo-shoots',
    title: 'Photo Shoots',
    category: 'photo-shoots',
    tagline: 'Flexible photography sessions for clients who have a specific concept, location, mood or creative direction.',
    description: 'Flexible photography sessions for clients who have a specific concept, location, mood or creative direction. Whether in studio or on-location, we collaborate closely to bring your unique aesthetic vision into sharp, permanent focus.',
    highlights: [
      'Concept development & visual moodboards',
      'Custom location scouting & lighting setups',
      'Dedicated on-set creative direction',
      'High-resolution master retouching',
      'Flexible usage rights & custom deliverables'
    ],
    deliverables: [
      'Digital contact sheets & proofing gallery',
      'Master retouched files in high resolution',
      'Full graded session archive'
    ],
    sampleImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=90&w=1600'
  }
];
