import { apiClient } from './apiClient.js';
import { isNetworkError } from './networkUtil.js';
import { mockStore } from './mockStore.js';

// Backend: biznes hisobi — balans, hisob-fakturalar, checkout, jamoa, mijozlar
export const businessService = {
  // Obuna holati — biznes dashboard faqat obuna faol (yoki hisob founder) bo'lsa ochiladi.
  getSubscription: async () => {
    try {
      return await apiClient.get('/business/subscription');
    } catch (err) {
      if (isNetworkError(err)) return mockStore.getSubscription();
      throw err;
    }
  },

  subscribe: async (plan, cardPayload) => {
    try {
      return await apiClient.post('/business/subscribe', { plan, ...cardPayload });
    } catch (err) {
      if (isNetworkError(err)) return mockStore.subscribe(plan, cardPayload);
      throw err;
    }
  },

  getOverview: async () => {
    try {
      return await apiClient.get('/business/overview');
    } catch (err) {
      if (isNetworkError(err)) return mockStore.getBusiness();
      throw err;
    }
  },

  getBalance: async () => {
    try {
      return await apiClient.get('/business/balance');
    } catch (err) {
      if (isNetworkError(err)) {
        const b = mockStore.getBusiness();
        return { balance: b.balance, payouts: b.payouts };
      }
      throw err;
    }
  },

  withdraw: async (data) => {
    try {
      return await apiClient.post('/business/withdraw', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.applyBizWithdraw(data.amount, data.cardId);
      throw err;
    }
  },

  listInvoices: async () => {
    try {
      return await apiClient.get('/business/invoices');
    } catch (err) {
      if (isNetworkError(err)) return { invoices: mockStore.getBusiness().invoices };
      throw err;
    }
  },

  createInvoice: async (data) => {
    try {
      return await apiClient.post('/business/invoices', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.addInvoice(data.client, data.due, data.amount);
      throw err;
    }
  },

  markInvoicePaid: async (id) => {
    try {
      return await apiClient.post(`/business/invoices/${id}/pay`);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.markInvoicePaid(id);
      throw err;
    }
  },

  listCheckoutPages: async () => {
    try {
      return await apiClient.get('/business/checkout-pages');
    } catch (err) {
      if (isNetworkError(err)) return { checkoutPages: mockStore.getBusiness().checkoutPages };
      throw err;
    }
  },

  createCheckoutPage: async (data) => {
    try {
      return await apiClient.post('/business/checkout-pages', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.addCheckoutPage(data.title);
      throw err;
    }
  },

  toggleCheckoutPage: async (id) => {
    try {
      return await apiClient.post(`/business/checkout-pages/${id}/toggle`);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.toggleCheckoutPage(id);
      throw err;
    }
  },

  listTeam: async () => {
    try {
      return await apiClient.get('/business/team');
    } catch (err) {
      if (isNetworkError(err)) return { team: mockStore.getBusiness().team };
      throw err;
    }
  },

  inviteTeamMember: async (data) => {
    try {
      return await apiClient.post('/business/team', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.addTeamMember(data.email, data.role);
      throw err;
    }
  },

  listCustomers: async () => {
    try {
      return await apiClient.get('/business/customers');
    } catch (err) {
      if (isNetworkError(err)) return { customers: mockStore.getBusiness().customers };
      throw err;
    }
  },

  listTransactions: async (params) => {
    try {
      return await apiClient.get('/business/transactions', { params });
    } catch (err) {
      if (isNetworkError(err)) return { transactions: mockStore.getBusiness().transactions };
      throw err;
    }
  },
};
