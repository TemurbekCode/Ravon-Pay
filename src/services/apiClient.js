import axios from 'axios';
import { API_URL } from '../utils/constants.js';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Backend hali ishga tushmagan bo'lsa, brauzer ulanish rad etilishini sekin aniqlaydi (bir necha soniya).
  // Qisqa timeout mock rejimga tezroq o'tishni ta'minlaydi; backend ulanganda kerak bo'lsa oshiriladi.
  timeout: 2000,
});

// Har so'rovga token qo'shish
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ravonpay_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Javobdan to'g'ridan-to'g'ri data olish
apiClient.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject({ ...err, message: err.response?.data?.message || err.message })
);
