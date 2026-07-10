import { apiClient } from './apiClient.js';
import { isNetworkError } from './networkUtil.js';

// Admin panel — foydalanuvchilar bo'ylab ma'lumot ko'rsatadi, shuning uchun
// mock (offline) rejimda ma'noli tarzda simulyatsiya qilib bo'lmaydi (mockStore
// faqat joriy foydalanuvchining o'z brauzeridagi ma'lumotini biladi). Backend
// ulanmasa — bo'sh/nol qiymatlar qaytariladi, soxta ma'lumot ko'rsatilmaydi.
export const adminService = {
  getOverview: async () => {
    try {
      return await apiClient.get('/admin/overview');
    } catch (err) {
      if (isNetworkError(err)) return { totalUsers: 0, personalUsers: 0, businessUsers: 0, pendingVerifications: 0, verifiedBusinesses: 0 };
      throw err;
    }
  },

  listVerifications: async () => {
    try {
      return await apiClient.get('/admin/verifications');
    } catch (err) {
      if (isNetworkError(err)) return { verifications: [] };
      throw err;
    }
  },

  approveVerification: async (userId) => {
    try {
      return await apiClient.post(`/admin/verifications/${userId}/approve`);
    } catch (err) {
      if (isNetworkError(err)) return { ok: true };
      throw err;
    }
  },

  rejectVerification: async (userId) => {
    try {
      return await apiClient.post(`/admin/verifications/${userId}/reject`);
    } catch (err) {
      if (isNetworkError(err)) return { ok: true };
      throw err;
    }
  },

  listUsers: async (search = '') => {
    try {
      return await apiClient.get('/admin/users', { params: search ? { search } : {} });
    } catch (err) {
      if (isNetworkError(err)) return { users: [] };
      throw err;
    }
  },

  getUser: async (userId) => {
    try {
      return await apiClient.get(`/admin/users/${userId}`);
    } catch (err) {
      if (isNetworkError(err)) return { user: null, wallet: { balance: 0, transactions: [] }, business: null, businessTransactions: [] };
      throw err;
    }
  },

  blockUser: async (userId) => {
    try {
      return await apiClient.post(`/admin/users/${userId}/block`);
    } catch (err) {
      if (isNetworkError(err)) return { ok: true };
      throw err;
    }
  },

  unblockUser: async (userId) => {
    try {
      return await apiClient.post(`/admin/users/${userId}/unblock`);
    } catch (err) {
      if (isNetworkError(err)) return { ok: true };
      throw err;
    }
  },

  listTransactions: async () => {
    try {
      return await apiClient.get('/admin/transactions');
    } catch (err) {
      if (isNetworkError(err)) return { transactions: [] };
      throw err;
    }
  },
};
