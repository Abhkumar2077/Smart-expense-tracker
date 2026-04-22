// frontend/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// ✅ ADD THIS: Request interceptor to ensure token is always sent
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ ADD THIS: Response interceptor to handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ Authentication failed - redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Expenses API
export const expenseAPI = {
  getAll: (params) => API.get('/expenses', { params }),
  create: (data) => API.post('/expenses', data),
  update: (id, data) => API.put(`/expenses/${id}`, data),
  delete: (id) => API.delete(`/expenses/${id}`),
  getSummary: (month, year) => API.get('/expenses/summary', { params: { month, year } }),
  getInsights: () => API.get('/expenses/insights'),
  exportCSV: (startDate, endDate) => API.get('/expenses/export/csv', { 
    params: { startDate, endDate },
    responseType: 'blob'
  })
};

// Categories API
export const categoryAPI = {
  getAll: () => API.get('/categories'),
  getSuggestions: () => API.get('/categories/suggestions'),
  getPopular: () => API.get('/categories/popular'),
  create: (data) => API.post('/categories', data),
  update: (id, data) => API.put(`/categories/${id}`, data),
  delete: (id) => API.delete(`/categories/${id}`),
  initDefaults: () => API.post('/categories/init-defaults'),
  checkMigration: () => API.get('/categories/migration/check'),
  runMigration: () => API.post('/categories/migration/run')
};

// Budgets API
export const budgetAPI = {
  upsert: (data) => API.post('/budgets', data),
  getStatus: (month) => API.get('/budgets/status', { params: { month } })
};

// Goals API
export const goalsAPI = {
  getAll: () => API.get('/goals'),
  create: (data) => API.post('/goals', data),
  update: (id, data) => API.put(`/goals/${id}`, data),
  delete: (id) => API.delete(`/goals/${id}`)
};

// Reminders API
export const remindersAPI = {
  getAll: () => API.get('/reminders'),
  create: (data) => API.post('/reminders', data),
  markAsPaid: (id) => API.put(`/reminders/${id}/paid`),
  delete: (id) => API.delete(`/reminders/${id}`)
};

// User API
export const userAPI = {
  getProfile: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  updatePassword: (data) => API.put('/auth/password', data)
};

// Dashboard API
export const dashboardAPI = {
  getSummary: (timeRange, month, year) => API.get('/dashboard/summary', { 
    params: { timeRange, month, year } 
  })
};

// AI API
export const aiAPI = {
  getInsights: () => API.get('/ai/insights'),
  getPatterns: () => API.get('/ai/patterns'),
  getForecast: () => API.get('/ai/forecast'),
  getAnomalies: () => API.get('/ai/anomalies'),
  getSavings: () => API.get('/ai/savings'),
  getGeminiInsights: () => API.get('/ai/gemini-insights'),
  getWeeklyDigest: () => API.get('/ai/weekly-digest'),
  getWeeklyDigests: () => API.get('/ai/weekly-digests'),
  generateWeeklyDigest: () => API.post('/ai/generate-weekly-digest')
};

// Suggestions API
export const suggestionsAPI = {
  getPending: () => API.get('/suggestions'),
  decide: (id, status) => API.patch(`/suggestions/${id}/decide`, { status }),
  getHistory: () => API.get('/suggestions/history')
};

// Email API
export const emailAPI = {
  sendWeeklyReport: () => API.post('/email/send-weekly-report')
};

// Upload API
export const uploadAPI = {
  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/upload/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  validateCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/upload/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  downloadTemplate: () => API.get('/upload/template', { responseType: 'blob' }),
  clearAll: () => API.delete('/upload/clear-all'),
  getStats: () => API.get('/upload/stats'),
  categorizePreview: (transactions) => API.post('/upload/categorize-preview', { transactions })
};

export default API;