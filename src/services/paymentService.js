import { apiClient } from './apiClient.js';
import { isNetworkError } from './networkUtil.js';
import { mockStore } from './mockStore.js';

// Backend: hamyon, tranzaksiya, to'lov havolalari
export const paymentService = {
  getBalance: async () => {
    try {
      return await apiClient.get('/wallet/balance');
    } catch (err) {
      if (isNetworkError(err)) return { balance: mockStore.getBalance() };
      throw err;
    }
  },

  topUp: async (data) => {
    try {
      return await apiClient.post('/wallet/topup', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.applyTopUp(data.amount);
      throw err;
    }
  },

  withdraw: async (data) => {
    try {
      return await apiClient.post('/wallet/withdraw', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.applyWithdraw(data.amount, data.cardId, data.twoFaCode);
      throw err;
    }
  },

  getTransactions: async (params) => {
    try {
      return await apiClient.get('/transactions', { params });
    } catch (err) {
      if (isNetworkError(err)) return { transactions: mockStore.getTransactions() };
      throw err;
    }
  },

  send: async (data) => {
    try {
      return await apiClient.post('/transactions/send', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.applySend(data.recipient, data.amount);
      throw err;
    }
  },

  payUtility: async (data) => {
    try {
      return await apiClient.post('/utilities/pay', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.applyUtilityPayment(data.category, data.account, data.amount);
      throw err;
    }
  },

  getContacts: async () => {
    try {
      return await apiClient.get('/contacts');
    } catch (err) {
      if (isNetworkError(err)) return { contacts: mockStore.getContacts() };
      throw err;
    }
  },

  addContact: async (data) => {
    try {
      return await apiClient.post('/contacts', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.addContact(data.name, data.phone);
      throw err;
    }
  },

  exchange: (data) => apiClient.post('/wallet/exchange', data),

  // Biznes
  listLinks: async () => {
    try {
      return await apiClient.get('/payments/links');
    } catch (err) {
      if (isNetworkError(err)) return { links: mockStore.getBusiness().links };
      throw err;
    }
  },

  createLink: async (data) => {
    try {
      return await apiClient.post('/payments/links', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.addLink(data.title, data.amount);
      throw err;
    }
  },

  getAnalytics: async () => {
    try {
      return await apiClient.get('/payments/analytics');
    } catch (err) {
      if (isNetworkError(err)) {
        const b = mockStore.getBusiness();
        return { revenue: b.revenue, salesCount: b.salesCount, avgOrder: b.avgOrder };
      }
      throw err;
    }
  },
};
