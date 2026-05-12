import api from './axiosInstance';

/**
 * Auth API — all requests go to /api/auth/*
 * Cookies are sent automatically via withCredentials: true
 */

export const registerUser = (data) =>
  api.post('/auth/register', data);

export const loginUser = (data) =>
  api.post('/auth/login', data);

export const logoutUser = () =>
  api.post('/auth/logout');

/** Used on app load — always 200 with user or null (no 401 in DevTools). */
export const checkSession = () =>
  api.get('/auth/session');

export const getMe = () =>
  api.get('/auth/me');
