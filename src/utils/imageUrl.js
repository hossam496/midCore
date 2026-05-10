/**
 * MedCore Image URL Resolver
 * 
 * Centralized utility to handle image paths across development and production.
 * It fixes hardcoded localhost URLs and ensures relative paths are correctly prefixed.
 */

// Hardcoded production backend as fallback
const PRODUCTION_BACKEND = 'https://backend-med-core.vercel.app';

// Get base URL from environment variable or fallback
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith('http')) {
    // Remove /api suffix to get the root domain for static files
    return envUrl.replace(/\/api\/?$/, '');
  }
  return PRODUCTION_BACKEND;
};

const BASE_URL = getBaseUrl();

/**
 * Resolves any image path into a full, valid URL.
 * @param {string} path - The image path or absolute URL from the database
 * @returns {string} - The full URL to the image
 */
export const getImageUrl = (path) => {
  if (!path) return "/default-avatar.png";
  if (typeof path !== 'string') return "/default-avatar.png";

  // Regex to catch: http://localhost:5001, http://127.0.0.1:5001, etc.
  const localRegex = /^https?:\/\/(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(?::\d+)?/i;
  
  if (localRegex.test(path)) {
    // Strip the local domain and port, then prefix with production BASE_URL
    const relativePath = path.replace(localRegex, '');
    return `${BASE_URL}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  }

  // If it's already a valid absolute URL (e.g. Google avatar), return as is
  if (path.startsWith("http")) {
    return path;
  }

  // Handle relative paths (e.g., /uploads/doctors/img.jpg)
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

export default getImageUrl;
