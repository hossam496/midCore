import api from './axiosInstance';

/**
 * ==========================================
 * PRESCRIPTIONS ENDPOINTS (الروشتات والوصفات)
 * ==========================================
 */

// Get all prescriptions for a specific patient
export const getPrescriptions = (patientId) => 
  api.get(`/prescriptions/patient/${patientId}`);

// Create/Add a new prescription script
export const createPrescription = (data) => 
  api.post('/prescriptions', data);

// Delete a prescription script by ID
export const deletePrescription = (id) => 
  api.delete(`/prescriptions/${id}`);


/**
 * ==========================================
 * VITALS LOGS ENDPOINTS (القياسات والتحاليل)
 * ==========================================
 */

// Get vital sign logs history for a patient
export const getVitals = (patientId) => 
  api.get(`/vitals/patient/${patientId}`);

// Create/Log a new vital sign measurement entry
export const createVitalLog = (data) => 
  api.post('/vitals', data);


/**
 * ==========================================
 * MEDICAL DOCUMENTS ENDPOINTS (المستندات والتقارير)
 * ==========================================
 */

// Get all medical documents and reports for a patient
export const getMedicalDocuments = (patientId) => 
  api.get(`/medical-documents/patient/${patientId}`);

// Add/Link a new medical document reference
export const createMedicalDocument = (data) => 
  api.post('/medical-documents', data);

// Delete a medical document reference by ID
export const deleteMedicalDocument = (id) => 
  api.delete(`/medical-documents/${id}`);
