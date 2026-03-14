// frontend/src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: '/api'
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
  updateBudget: (budget) => API.put('/expenses/budget', { monthly_budget: budget }),
  exportCSV: (startDate, endDate) => API.get('/expenses/export/csv', { 
    params: { startDate, endDate },
    responseType: 'blob'
  })
};

// Categories API
export const categoryAPI = {
  getAll: () => API.get('/categories')
};

// AI API
export const aiAPI = {
  getInsights: () => API.get('/ai/insights'),
  getPatterns: () => API.get('/ai/patterns'),
  getForecast: () => API.get('/ai/forecast'),
  getAnomalies: () => API.get('/ai/anomalies'),
  getSavings: () => API.get('/ai/savings')
};

// Upload API
export const uploadAPI = {
  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/upload/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const API = axios.create({
  baseURL: '/api',
  headers: {
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
});
  },
  validateCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post('/upload/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  downloadTemplate: () => API.get('/upload/template', { responseType: 'blob' })
};

export default API;