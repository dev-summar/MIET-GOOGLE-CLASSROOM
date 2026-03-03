import axios from 'axios';

// Prefer env; fallback to relative /api for same-origin/proxy (avoids localhost in production build)
const baseURL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error ?? err.response?.data?.message ?? err.message ?? 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
