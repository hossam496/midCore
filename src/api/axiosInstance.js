import axios from 'axios';

/**
 * Pre-configured Axios instance for all MedCore API calls.
 * - Base URL points to the backend
 * - withCredentials: true → sends HTTP-only cookie on every request
 * - Centralized request/response interceptors
 */
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export { BASE_URL };


// ── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // We handle global 401s in AuthContext / ProtectedRoutes
    // to avoid hard page reloads and redirect loops.
    return Promise.reject(error);
  }
);

export default api;
