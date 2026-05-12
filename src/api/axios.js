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

// Response Interceptor for global error handling and retries
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    // Retry logic for Network Errors or 5xx errors
    if (!config || !config.retry) config.retry = 0;
    
    // Heartbeat / telemetry: never auto-retry (avoids 4× traffic on flaky backend)
    if (config.skipErrorRetry) {
      return Promise.reject(error);
    }

    if (config.retry < 3 && (!response || response.status >= 500)) {
      config.retry += 1;
      const delay = Math.pow(2, config.retry) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return axiosInstance(config);
    }

    if (import.meta.env.DEV) {
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase() || '??'} ${error.config?.url || '??'}`,
        error.response?.status || 'No Status',
        error.response?.data?.message || error.message
      );
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
