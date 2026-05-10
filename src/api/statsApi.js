import axiosInstance from './axiosInstance';

export const getAdminStats = () => axiosInstance.get('/stats/admin');
export const getDoctorStats = () => axiosInstance.get('/stats/doctor');
