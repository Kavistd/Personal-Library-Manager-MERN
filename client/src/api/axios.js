import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
});

// Request interceptor: attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: if 401 → logout + redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login (using window.location to ensure full page reload)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
