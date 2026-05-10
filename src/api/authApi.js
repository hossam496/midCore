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

export const getMe = () =>
  api.get('/auth/me');
