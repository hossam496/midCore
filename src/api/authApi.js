import api from './axiosInstance';

/**
 * Auth API — all requests go to /api/auth/*
 * Cookies are sent automatically via withCredentials: true
 */

export const registerUser = (data) =>
  api.post('/auth/register', data);

export const loginUser = (data) =>
  api.post('/auth/login', data);

/**
 * Logout — marked skipErrorRetry so the Axios interceptor does NOT attempt
 * a silent token refresh before calling logout. This prevents a 401→refresh→logout loop.
 * The backend logout route no longer requires a valid access token.
 */
export const logoutUser = () =>
  api.post('/auth/logout', {}, { skipErrorRetry: true });

/**
 * Session check — called once on app load.
 * Backend always returns 200 (with user or null), never 401.
 * skipErrorRetry prevents an unnecessary refresh attempt.
 */
export const checkSession = () =>
  api.get('/auth/session', { skipErrorRetry: true });

export const getMe = () =>
  api.get('/auth/me');

export const refreshToken = () =>
  api.post('/auth/refresh');
