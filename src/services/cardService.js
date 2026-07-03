import { apiClient } from './apiClient.js';
import { isNetworkError } from './networkUtil.js';
import { mockStore } from './mockStore.js';

// Backend: virtual/jismoniy kartalar
export const cardService = {
  listCards: async () => {
    try {
      return await apiClient.get('/cards');
    } catch (err) {
      if (isNetworkError(err)) return { cards: mockStore.getCards() };
      throw err;
    }
  },

  createCard: async (data) => {
    try {
      return await apiClient.post('/cards', data);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.addCard(data);
      throw err;
    }
  },

  freezeCard: async (id) => {
    try {
      return await apiClient.post(`/cards/${id}/freeze`);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.toggleFreezeCard(id);
      throw err;
    }
  },

  deleteCard: async (id) => {
    try {
      return await apiClient.delete(`/cards/${id}`);
    } catch (err) {
      if (isNetworkError(err)) return mockStore.removeCard(id);
      throw err;
    }
  },
};
