import axios from 'axios';
import { API_URL } from '../utils/constants.js';

// Login/Register sahifasi ochilgan zahoti chaqiriladi — agar backend uyg'onayotgan
// bo'lsa, foydalanuvchi telefon raqamini kiritib bo'lguncha unga bir necha soniya
// bosh berish uchun (to'liq cold-start vaqtini kafolatlamaydi, lekin kamaytiradi).
// /health "/api/v1" ostida emas, shuning uchun API_URL'dan alohida hisoblanadi.
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');
export function warmupBackend() {
  fetch(`${BACKEND_ORIGIN}/health`).catch(() => { /* uyg'onmagan bo'lsa ham keyingi haqiqiy so'rov normal kutadi */ });
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Render'ning bepul tarifi 15 daqiqa harakatsizlikdan keyin backend'ni to'liq
  // to'xtatadi ("spin down") — keyingi so'rov uni qayta ishga tushiradi, bu esa
  // Render'ning o'zi ogohlantirganidek 50+ soniya cho'zilishi mumkin. Ilgari bu
  // qiymat 15000ms edi — shu sabab tufayli aynan cold-start paytida haqiqiy
  // so'rovlar "tarmoq xatosi" deb noto'g'ri hisoblanib, foydalanuvchi hisobiga
  // kira olmay qolardi.
  timeout: 65000,
});

// Har so'rovga token qo'shish
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ravonpay_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Access token qisqa muddatli (1 soat) — muddati tugab 401 qaytsa, saqlangan
// refreshToken bilan avtomatik yangilab, so'rovni BIR MARTA qayta yuboradi.
// Bir vaqtda bir nechta so'rov 401 qaytarsa ham, refresh faqat bir marta
// chaqiriladi (parallel so'rovlar shu bitta jarayonni kutadi).
let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('ravonpay_refresh_token');
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN');
  const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  localStorage.setItem('ravonpay_access_token', res.data.accessToken);
  localStorage.setItem('ravonpay_refresh_token', res.data.refreshToken);
  return res.data.accessToken;
}

apiClient.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const original = err.config;
    const isAuthRoute = original?.url?.includes('/auth/refresh') || original?.url?.includes('/auth/otp') || original?.url?.includes('/auth/google');
    if (err.response?.status === 401 && !original?._retried && !isAuthRoute && localStorage.getItem('ravonpay_refresh_token')) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise || refreshAccessToken().finally(() => { refreshPromise = null; });
        const newAccessToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(original);
      } catch {
        localStorage.removeItem('ravonpay_access_token');
        localStorage.removeItem('ravonpay_refresh_token');
      }
    }
    return Promise.reject({ ...err, message: err.response?.data?.message || err.message });
  }
);
