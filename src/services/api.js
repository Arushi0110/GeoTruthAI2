import axios from 'axios';

/**
 * Axios instance for API calls.
 * Vite dev server proxies /api, /auth to the Node.js backend at http://localhost:5000.
 * The Node backend then calls Python FastAPI at http://localhost:8000 for AI services.
 */
const api = axios.create({
  baseURL: '', // Use relative URLs — Vite proxy handles routing
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out. Please try again.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('Network error. Is the backend running?'));
    }
    const message = error.response.data?.message || error.response.data?.detail || error.message;
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  getMe: () => api.get('/auth/me'),
};

export const newsAPI = {
  analyze: (formData) =>
    api.post('/api/news/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getHistory: (params) => api.get('/api/news/history', { params }),
  getById: (id) => api.get(`/api/news/${id}`),
  vote: (id, vote) => api.post(`/api/news/${id}/vote`, { vote }),
};

export const voteAPI = {
  submit: (data) => api.post('/api/votes', data),
  getVotes: (newsId) => api.get(`/api/votes/${newsId}`),
  getUserVote: (newsId) => api.get(`/api/votes/${newsId}/user`),
};

export const chatAPI = {
  sendMessage: (message, context) => api.post('/api/chat/message', { message, context }),
  getHistory: () => api.get('/api/chat/history'),
};

export default api;


