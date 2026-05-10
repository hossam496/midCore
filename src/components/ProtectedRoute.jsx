import React, { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      Swal.fire({
        title: 'Access Restricted',
        text: 'You must register or login first to view doctors.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Login',
        cancelButtonText: 'Register',
        confirmButtonColor: '#2563eb', // Blue-600
        cancelButtonColor: '#64748b', // Slate-500
        reverseButtons: true,
        background: '#ffffff',
        customClass: {
          popup: 'rounded-[2rem]',
          confirmButton: 'rounded-xl px-6 py-3 font-bold',
          cancelButton: 'rounded-xl px-6 py-3 font-bold'
        },
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/login', { state: { from: location } });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          navigate('/register');
        } else {
          // If they just close the modal, take them home
          navigate('/');
        }
      });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (isAuthenticated && allowedRole && user?.role !== allowedRole) {
      Swal.fire({
        title: 'Access Restricted',
        text: `This area is restricted to ${allowedRole}s only.`,
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  }, [isAuthenticated, user, allowedRole]);

  if (!isAuthenticated) {
    // Return null or a placeholder to prevent flashing the protected content
    return null;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
