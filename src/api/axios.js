import axios from 'axios';

/**
 * In-Memory Access Token storage for maximum security (XSS protection)
 */
let _accessToken = '';

export const getAccessToken = () => _accessToken;
export const setAccessToken = (token) => {
  _accessToken = token;
};

// Queue for failed requests during silent token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

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

// Request Interceptor: Attach the in-memory access token as a Bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // FormData must not use application/json or a hand-written multipart type (missing boundary).
    if (config.data instanceof FormData && config.headers) {
      const h = config.headers;
      if (typeof h.delete === 'function') {
        h.delete('Content-Type');
      } else if (typeof h.set === 'function') {
        try {
          h.set('Content-Type', undefined);
        } catch {
          delete h['Content-Type'];
        }
      } else {
        delete h['Content-Type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle automatic silent token refresh on 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (!config) return Promise.reject(error);

    // 1. If unauthorized (401) and not already retrying, attempt silent refresh
    if (response && response.status === 401 && !config._retry) {
      // Prevent infinite loops if the refresh endpoint itself returns 401
      if (config.url === '/auth/refresh' || config.url === 'auth/refresh') {
        setAccessToken('');
        return Promise.reject(error);
      }

      config._retry = true;

      if (isRefreshing) {
        // Queue this request while another silent refresh is already in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            config.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(config);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      return new Promise((resolve, reject) => {
        // Trigger silent token refresh request to the backend
        axiosInstance
          .post('/auth/refresh')
          .then((res) => {
            const newAccessToken = res.data.accessToken;
            setAccessToken(newAccessToken);
            
            // Re-sign original request with new access token
            config.headers['Authorization'] = `Bearer ${newAccessToken}`;
            
            processQueue(null, newAccessToken);
            resolve(axiosInstance(config));
          })
          .catch((refreshError) => {
            processQueue(refreshError, null);
            setAccessToken('');
            
            // Trigger automatic session expiration callback on React context
            if (window.__logoutCallback) {
              window.__logoutCallback();
            }
            
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    // 2. Retry logic for general network errors or 5xx errors (with exponential backoff)
    if (!config.retry) config.retry = 0;
    if (config.skipErrorRetry) {
      return Promise.reject(error);
    }

    if (config.retry < 3 && (!response || response.status >= 500)) {
      config.retry += 1;
      const delay = Math.pow(2, config.retry) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
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
