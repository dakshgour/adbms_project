import axios from 'axios';

function resolveBaseURL() {
  const configured = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
  if (!configured) return '/api/v1';
  if (configured.endsWith('/api/v1')) return configured;
  return `${configured}/api/v1`;
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: extract error messages cleanly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorData = error.response?.data;
    const message = errorData?.message || error.message || 'An unexpected error occurred';
    
    // Auto logout on 401 Unauthorized if expired
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      if (errorData?.error?.code === 'EXPIRED_TOKEN') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    
    return Promise.reject(new Error(message));
  }
);

export default api;
