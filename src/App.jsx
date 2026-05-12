import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import FindSpecialist from './pages/FindSpecialist';
import DoctorProfile from './pages/DoctorProfile';
import ContactPage from './pages/ContactPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AppointmentPage from './pages/AppointmentPage';
import PatientDetailsPage from './pages/PatientDetailsPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import PatientMessagesPage from './pages/PatientMessagesPage';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import BookingErrorBoundary from './components/BookingErrorBoundary';

// Lazy load dashboard modules for performance
const DoctorRoutes = React.lazy(() => import('./dashboard/routes/DoctorRoutes'));
const AdminRoutes = React.lazy(() => import('./dashboard/routes/AdminRoutes'));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Auto-recovery for dynamic import failures
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message && e.message.includes('Failed to fetch dynamically imported module')) {
      console.warn('Dynamic import failed, reloading page...');
      window.location.reload();
    }
  });
}

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <SocketProvider>
            <BookingProvider>
              <Toaster position="top-right" reverseOrder={false} />
              <React.Suspense fallback={<LoadingScreen />}>
                <Routes>
                  {/* Role-Based Dashboard Routes */}
                  <Route
                    path="/doctor/*"
                    element={
                      <ProtectedRoute allowedRole="doctor">
                        <DoctorRoutes />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute allowedRole="admin">
                        <AdminRoutes />
                      </ProtectedRoute>
                    }
                  />

                  {/* Public App Routes */}
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<HomePage />} />
                    <Route
                      path="specialists"
                      element={
                        <ProtectedRoute>
                          <FindSpecialist />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="specialists/:id" element={<DoctorProfile />} />
                    <Route
                      path="schedule/:doctorId"
                      element={
                        <ProtectedRoute>
                          <AppointmentPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="patient-details"
                      element={
                        <ProtectedRoute>
                          <PatientDetailsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="booking-confirmation"
                      element={
                        <ProtectedRoute>
                          <BookingErrorBoundary>
                            <BookingConfirmationPage />
                          </BookingErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="messages"
                      element={
                        <ProtectedRoute>
                          <PatientMessagesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="contact" element={<ContactPage />} />
                    <Route path="register" element={<RegisterPage />} />
                    <Route path="login" element={<LoginPage />} />
                  </Route>
                </Routes>
              </React.Suspense>
            </BookingProvider>
          </SocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;