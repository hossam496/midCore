import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './common/components/ProtectedRoute';
import DoctorRoutes from './routes/DoctorRoutes';
import AdminRoutes from './routes/AdminRoutes';

// Mock user state (normally from AuthContext)
const user = { role: 'doctor' }; // Change to 'admin' to test admin portal

function App() {
  return (
    <Router>
      <Routes>
        {/* Base redirection */}
        <Route path="/" element={
          user.role === 'admin' ? <Navigate to="/dashboard/admin/dashboard" replace /> : <Navigate to="/dashboard/doctor/dashboard" replace />
        } />

        {/* Doctor Portal */}
        <Route 
          path="/dashboard/doctor/*" 
          element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorRoutes />
            </ProtectedRoute>
          } 
        />

        {/* Admin Portal */}
        <Route 
          path="/dashboard/admin/*" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminRoutes />
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;


