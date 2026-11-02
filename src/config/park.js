// Public park identity & contact defaults.
// Values come from environment variables (see .env.example) so nothing is
// hardcoded in source. Admin "Water Park Settings" can override these at runtime.
const env = import.meta.env;

export const PARK_DEFAULTS = {
  name: 'MASTI ZONE',
  tagline: 'Water Park & Splash Resort',
  phone: env.VITE_PARK_PHONE || '',
  whatsapp: env.VITE_PARK_WHATSAPP || '',
  email: env.VITE_PARK_EMAIL || '',
  address: env.VITE_PARK_ADDRESS || '',
  mapEmbedUrl: env.VITE_PARK_MAP_EMBED_URL || '',
  instagram: env.VITE_PARK_INSTAGRAM || 'https://instagram.com/',
  instagramHandle: '@mastizone',
  facebook: env.VITE_PARK_FACEBOOK || 'https://facebook.com/',
  youtube: env.VITE_PARK_YOUTUBE || 'https://youtube.com/',
  openTime: '10:00',
  closeTime: '18:00',
  weeklyOff: [], // 0 = Sunday ... 6 = Saturday
  taxRate: 18, // GST %
  maxTicketsPerBooking: 15,
  advanceBookingDays: 60,
  bookingsOpen: true,
  announcement: 'Monsoon Splash Week — wave pool open till 7 PM every weekend.',
};

export const API_BASE_URL = env.VITE_API_BASE_URL || '';
