import axios from 'axios';

/**
 * Pre-configured Axios instance for all MedCore API calls.
 * - Base URL points to the backend
 * - withCredentials: true → sends HTTP-only cookie on every request
 * - Centralized request/response interceptors
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,          // Send cookies (JWT) with every request
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,                 // 15 second timeout
});

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
