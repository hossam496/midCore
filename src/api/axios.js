import axios from 'axios';

/**
 * Centralized Axios configuration for MedCore Production.
 * 
 * Production: https://backend-med-core.vercel.app/api
 * Development: http://localhost:5001/api
 */

const DEV_API = 'http://localhost:5001/api';
const PROD_API = 'https://backend-med-core.vercel.app/api';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? DEV_API : PROD_API),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 20000,
});

// Response Interceptor for global error handling
axiosInstance.interceptors.response.use(
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

export default axiosInstance;
