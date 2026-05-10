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

// Only use VITE_API_URL if it's a valid absolute URL (starts with http)
const envUrl = import.meta.env.VITE_API_URL;
const API_URL = (envUrl && envUrl.startsWith('http')) ? envUrl : PRODUCTION_API;

// Base URL without /api suffix (used for constructing image/file URLs)
export const API_URL_EXPORT = API_URL; // Renamed to avoid collision if any
export const BASE_URL = API_URL.replace(/\/api\/?$/, '');

/**
 * Helper to get the full URL for an image/file.
 * It handles:
 * 1. Relative paths (prefixes with BASE_URL)
 * 2. Absolute URLs (returns as-is)
 * 3. Legacy localhost URLs (replaces localhost with BASE_URL)
 */
export const getFullImageUrl = (path) => {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  
  // If it's a legacy localhost URL from a previous local upload, strip it and use BASE_URL
  if (path.includes('localhost:5001')) {
    const relativePath = path.split('localhost:5001')[1];
    return `${BASE_URL}${relativePath}`;
  }

  // If it's already an absolute URL (like a Google avatar or Gravatar), return as is
  if (path.startsWith('http')) {
    return path;
  }

  // Otherwise, treat as relative path and prefix with current BASE_URL
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,    // Required for cross-origin cookie (JWT auth)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000, // 20 second timeout for Vercel cold starts
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
