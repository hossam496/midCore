import api from './axios';
import getImageUrl from '../utils/imageUrl';

/**
 * Legacy compatibility layer. 
 * Use import api from './axios' for new code.
 */

export const BASE_URL = (import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')) 
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
  : 'https://backend-med-core.vercel.app';

export { getImageUrl };
export const getFullImageUrl = getImageUrl;

export default api;
