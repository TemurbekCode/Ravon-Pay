import { apiClient } from './apiClient.js';
import { isNetworkError } from './networkUtil.js';
import { mockStore } from './mockStore.js';

// Backend: bildirishnomalar (SMS/push xabarlar tarixi)
export const notificationService = {
  list: async () => {
    try {
      return await apiClient.get('/notifications');
    } catch (err) {
      if (isNetworkError(err)) return { notifications: mockStore.getNotifications() };
      throw err;
    }
  },

  markAllRead: async () => {
    try {
      return await apiClient.post('/notifications/read-all');
    } catch (err) {
      if (isNetworkError(err)) return { notifications: mockStore.markAllNotificationsRead() };
      throw err;
    }
  },
};
