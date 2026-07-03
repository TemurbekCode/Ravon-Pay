// Ilova konstantalari
export const APP_NAME = 'RavonPay';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
export const USD_RATE = 12640;

export const ROUTES = {
  landing: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  wallet: '/dashboard/wallet',
  cards: '/dashboard/cards',
  receive: '/dashboard/receive',
  send: '/dashboard/send',
  exchange: '/dashboard/exchange',
  utilities: '/dashboard/utilities',
  history: '/dashboard/history',
  aiAdviser: '/dashboard/ai-adviser',
  settings: '/dashboard/settings',
  profile: '/dashboard/profile',
};

export const ACCOUNT_TYPES = { PERSONAL: 'personal', BUSINESS: 'business' };

// Founder/CEO hisobi — biznes dashboard uchun obuna (to'lov) talab qilinmaydi.
export const FOUNDER_EMAIL = 'ravonpay@gmail.com';
