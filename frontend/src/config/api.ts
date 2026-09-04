import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '';
export const WS_BASE = import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + window.location.host;

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT Bearer Token if available in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling (auto redirect or clean state)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected route, clean token
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
      }
    }
    return Promise.reject(error);
  }
);
