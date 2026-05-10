import axios from 'axios';

/**
 * Pre-configured Axios instance for all MedCore API calls.
 *
 * IMPORTANT:
 * - baseURL points to the deployed backend
 * - withCredentials: true → sends HTTP-only cookie (JWT) on every request
 * - In development, Vite proxy forwards /api → localhost:5001 (see vite.config.js)
 * - In production, VITE_API_URL is set to https://backend-med-core.vercel.app/api
 */

// The full API base URL (e.g. https://backend-med-core.vercel.app/api)
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-med-core.vercel.app/api';

// The base URL without /api (used for constructing image/file URLs)
export const BASE_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,    // Required for cross-origin cookie (JWT auth)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000, // 20 second timeout
});

// ── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors in development only
    if (import.meta.env.DEV) {
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        error.response?.status,
        error.response?.data?.message || error.message
      );
    }
    return Promise.reject(error);
  }
);

export default api;
