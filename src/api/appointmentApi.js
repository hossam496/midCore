import api from './axiosInstance';

export const createAppointment = (data) => api.post('/appointments', data);
export const getAppointments = () => api.get('/appointments');
export const updateAppointmentStatus = (id, status) => api.patch(`/appointments/${id}/status`, { status });
export const cancelAppointment = (id) => api.patch(`/appointments/${id}/cancel`);
export const getAvailableSlots = (doctorId, date) => api.get(`/appointments/slots/${doctorId}?date=${date}`);
export const updateAppointment = (id, data) => api.patch(`/appointments/${id}`, data);

