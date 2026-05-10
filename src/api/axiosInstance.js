import axios from 'axios';

/**
 * Pre-configured Axios instance for all MedCore API calls.
 *
 * IMPORTANT:
 * - baseURL is hardcoded to the production backend as the primary source
 * - VITE_API_URL env var can override it (set in Vercel dashboard)
 * - withCredentials: true → sends HTTP-only cookie (JWT) on every request
 */

// Hardcoded production backend URL — always correct even if env var is missing
const PRODUCTION_API = 'https://backend-med-core.vercel.app/api';

import getImageUrl from '../utils/imageUrl';

// Export BASE_URL and getImageUrl for global use
export const BASE_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) 
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
  : 'https://backend-med-core.vercel.app';

export { getImageUrl };
export const getFullImageUrl = getImageUrl; // Maintain backward compatibility with previous turn

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) 
    ? import.meta.env.VITE_API_URL 
    : 'https://backend-med-core.vercel.app/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000,
});

// ── Response Interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
