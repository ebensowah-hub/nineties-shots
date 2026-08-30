import { SiteConfig, PortfolioCategory } from '../types';

/**
 * =====================================================================
 * NINETIES SHOTS — CENTRAL SITE & CONTACT CONFIGURATION
 * =====================================================================
 * All contact information, social links, and brand messaging are
 * configured in this single file. Replacing values here updates the
 * entire application automatically.
 */

export const siteConfig: SiteConfig = {
  brandName: 'NINETIES SHOTS',
  tagline: 'Photography. Stories. Moments.',
  manifesto: {
    headline: 'WE CAPTURE MOMENTS THE WAY THEY FELT.',
    subheadline: 'A raw, modern lens on contemporary culture, human form, and fleeting light.',
    paragraphs: [
      'NINETIES SHOTS was born from a desire to strip away artificiality in modern photography. In an era saturated with hyper-processed visuals and generic templates, we focus on genuine presence, atmospheric lighting, and unscripted emotion.',
      'From intimate character portraits to natural lifestyle chronicles and creative photo shoots, each frame is approached with cinematic discipline and an obsession with authentic texture.'
    ]
  },
  copyrightYear: 2026,
  contact: {
    email: '',
    phone: '020 806 6924',
    // Single centralized WhatsApp configuration (Resolves to https://wa.me/233208066924)
    whatsappNumber: '+233208066924',
    whatsappDefaultMessage: 'Hello NINETIES SHOTS, I would like to inquire about booking a photography shoot.',
    location: 'Available Worldwide — Studio & On-Location',
    availabilityNotice: 'Accepting select portrait sessions, lifestyle projects, and commissioned photo shoots for 2026.'
  },
  socials: [
    {
      platform: 'instagram',
      label: '@nineties_shots',
      url: 'https://www.instagram.com/nineties_shots/'
    },
    {
      platform: 'tiktok',
      label: '@nineties_shot1',
      url: 'https://www.tiktok.com/@nineties_shot1'
    }
  ]
};

export const portfolioCategories: PortfolioCategory[] = [
  {
    id: 'all',
    name: 'All Works',
    description: 'A curated overview of portraits, lifestyle moments, and commissioned photo shoots.'
  },
  {
    id: 'portraits',
    name: 'Portraits',
    description: 'Individual and personal portrait photography focused on identity and strong visual presence.'
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: 'Natural, candid, creative and lifestyle-focused photography capturing personality and atmosphere.'
  },
  {
    id: 'photo-shoots',
    name: 'Photo Shoots',
    description: 'Commissioned photography sessions and flexible creative shoots tailored to your concept and vision.'
  }
];
