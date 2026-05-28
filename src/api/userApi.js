import axiosInstance from './axiosInstance';

export const getUsers = () => axiosInstance.get('/users');
export const deleteUser = (id) => axiosInstance.delete(`/users/${id}`);
export const registerStaff = (data) => axiosInstance.post('/users/register-new-staff', data);
export const getUserById = (id) => axiosInstance.get(`/users/${id}`);
export const getPatients = () => axiosInstance.get('/users');
export const updateUserProfile = (id, data) => axiosInstance.patch(`/users/${id}`, data);
