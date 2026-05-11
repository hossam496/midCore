import React, { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

/**
 * ProtectedRoute — Guards routes based on auth state and user role.
 *
 * Fix for React Error #306:
 * - All hooks (useAuth, useNavigate, useLocation, useEffect) are called
 *   unconditionally at the top level — never inside conditions.
 * - Early returns are placed AFTER all hook calls.
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  // ✅ ALL hooks must be called at the top level, unconditionally
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Effect 1: Handle unauthenticated users
  useEffect(() => {
    if (loading) return; // Wait for auth check to complete
    if (!isAuthenticated) {
      Swal.fire({
        title: 'Access Restricted',
        text: 'You must register or login first to view doctors.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Login',
        cancelButtonText: 'Register',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#64748b',
        reverseButtons: true,
        background: '#ffffff',
        customClass: {
          popup: 'rounded-[2rem]',
          confirmButton: 'rounded-xl px-6 py-3 font-bold',
          cancelButton: 'rounded-xl px-6 py-3 font-bold'
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login', { state: { from: location } });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          navigate('/register');
        } else {
          navigate('/');
        }
      });
    }
  }, [isAuthenticated, loading, navigate, location]);

  // Effect 2: Handle unauthorized role access
  useEffect(() => {
    if (loading) return;
    if (isAuthenticated && allowedRole && user?.role !== allowedRole) {
      Swal.fire({
        title: 'Access Restricted',
        text: `This area is restricted to ${allowedRole}s only.`,
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  }, [isAuthenticated, user, allowedRole, loading]);

  // ✅ Early returns AFTER all hook calls
  // Show spinner while verifying session (prevents flash + hook order issues)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Render null while the Swal dialog guides the user
    return null;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
