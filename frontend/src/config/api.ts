import axios from 'axios';

export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    // 1. Check URL query parameters (?backend=https://xxx.trycloudflare.com or ?api=...)
    const urlParams = new URLSearchParams(window.location.search);
    const paramBackend = urlParams.get('backend') || urlParams.get('api');
    if (paramBackend) {
      const clean = paramBackend.trim().replace(/\/+$/, '');
      localStorage.setItem('sentinel_backend_url', clean);
      // Clean query parameter from address bar without reloading
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      return clean;
    }

    // 2. Check localStorage for previously configured tunnel or backend
    const saved = localStorage.getItem('sentinel_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }

    // 3. Fallback for localhost development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }
  return (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
}

export function setBackendUrl(url: string) {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      const clean = url.trim().replace(/\/+$/, '');
      localStorage.setItem('sentinel_backend_url', clean);
      api.defaults.baseURL = clean;
    } else {
      localStorage.removeItem('sentinel_backend_url');
      api.defaults.baseURL = getBackendUrl();
    }
  }
}

export function getWsUrl(): string {
  const backend = getBackendUrl();
  if (backend.startsWith('https://')) {
    return backend.replace(/^https:\/\//, 'wss://');
  }
  if (backend.startsWith('http://')) {
    return backend.replace(/^http:\/\//, 'ws://');
  }
  return (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8000';
}

export const API_BASE = getBackendUrl();
export const WS_BASE = getWsUrl();

export const api = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamically inject active Backend URL and JWT Bearer Token on every request
api.interceptors.request.use((config) => {
  const activeBackend = getBackendUrl();
  if (!config.baseURL || config.baseURL === 'http://localhost:8000') {
    config.baseURL = activeBackend;
  }
  const token = localStorage.getItem('token') || localStorage.getItem('sentinel_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
      }
    }
    return Promise.reject(error);
  }
);
