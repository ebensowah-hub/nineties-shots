import { SiteConfig, PortfolioCategory } from '../types';

export const siteConfig: SiteConfig = {
  brandName: 'NINETIES SHOTS',
  tagline: 'Raw, Modern & Cinematic Photography',
  manifesto: {
    headline: 'A Raw, Modern Eye on Human Energy',
    subheadline: 'Editorial portraits, authentic lifestyle documentation, and curated visual campaigns across Ghana and worldwide.',
    paragraphs: [
      'NINETIES SHOTS explores the tension between 90s editorial nostalgia and contemporary digital sharpness.',
      'We believe photographs should command attention without contrivance, capturing human presence in its most vibrant, cinematic, and truthful dimension.'
    ]
  },
  copyrightYear: 2026,
  contact: {
    email: 'commissions@ninetiesshots.com',
    phone: '020 806 6924',
    whatsappNumber: '+233208066924',
    whatsappDefaultMessage: 'Hello NINETIES SHOTS, I would like to inquire about booking a photo shoot.',
    location: 'Accra, Ghana & Worldwide',
    availabilityNotice: 'Accepting select commissions for 2026'
  },
  socials: [
    { platform: 'instagram', label: 'Instagram', url: 'https://instagram.com/ninetiesshots' },
    { platform: 'x', label: 'X (Twitter)', url: 'https://x.com/ninetiesshots' },
    { platform: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@ninetiesshots' },
    { platform: 'behance', label: 'Behance', url: 'https://behance.net/ninetiesshots' }
  ]
};

export const portfolioCategories: PortfolioCategory[] = [
  {
    id: 'all',
    name: 'All Works',
    description: 'Complete archive of commissioned and personal photography works.'
  },
  {
    id: 'portraits',
    name: 'Portraits',
    description: 'Studio and natural light portraits highlighting character, nuance, and depth.'
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Candid, atmospheric visual narratives capturing life, energy, and motion.'
  },
  {
    id: 'photo-shoots',
    name: 'Photo Shoots',
    description: 'High-concept creative sessions, editorial campaigns, and brand lookbooks.'
  }
];
