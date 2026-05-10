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

  // 1. Handle absolute URLs (Google avatars, etc.)
  if (path.startsWith("http") && !path.includes("localhost:")) {
    return path;
  }

  // 2. Fix legacy hardcoded localhost URLs from database
  if (path.includes("localhost:5000") || path.includes("localhost:5001")) {
    // Extract the path after the domain
    // e.g., http://localhost:5001/uploads/image.jpg -> /uploads/image.jpg
    const parts = path.split(/localhost:500[01]/);
    const relativePath = parts[parts.length - 1];
    return `${BASE_URL}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  }

  // 3. Handle relative paths (e.g., /doctors/img.jpg or uploads/img.jpg)
  // Ensure the path starts with a slash for consistent concatenation
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Note: Backend might serve from /uploads, /doctors, or /chat
  // If the path already includes these, don't double-prefix
  return `${BASE_URL}${cleanPath}`;
};

export default getImageUrl;
