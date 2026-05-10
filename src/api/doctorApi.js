import api from './axiosInstance';

/**
 * Doctor API — fetch doctors listing and individual profiles.
 */

export const getDoctors = (params) =>
  api.get('/doctors', { params });

export const getDoctorById = (id) =>
  api.get(`/doctors/${id}`);

export const getMyDoctorProfile = () =>
  api.get('/doctors/me');

export const updateMyDoctorProfile = (data) =>
  api.put('/doctors/me', data);

export const uploadDoctorImage = (formData) =>
  api.post('/media', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
export const toggleBlockSlot = (data) =>
  api.post('/doctors/block-slot', data);
export const getSpecialties = () =>
  api.get('/doctors/specialties');
