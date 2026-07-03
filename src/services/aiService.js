import { apiClient } from './apiClient.js';

// Backend: AI moliyaviy maslahatchi
export const aiService = {
  ask: (message) => apiClient.post('/ai/ask', { message }),
  getInsights: () => apiClient.get('/ai/insights'),
  getHistory: () => apiClient.get('/ai/history'),
};
