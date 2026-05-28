import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loginUser, logoutUser, checkSession, registerUser } from '../api/authApi';
import { setAccessToken } from '../api/axios';
import { unsubscribeFromPush } from '../utils/pushNotifications';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // true until we verify session
  const navigate = useNavigate();

  /**
   * handleSessionExpired - Callback invoked when Axios interceptor detects an expired or revoked refresh token.
   */
  const handleSessionExpired = useCallback(() => {
    setAccessToken('');
    setUser(null);
    setIsAuthenticated(false);
    toast.error('انتهت صلاحية الجلسة الآمنة. الرجاء تسجيل الدخول مرة أخرى.', {
      id: 'session-expired-toast',
      duration: 5000,
      style: {
        borderRadius: '1rem',
        background: '#334155',
        color: '#fff',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: 'bold',
      },
    });
    navigate('/login', { replace: true });
  }, [navigate]);

  // Bind the global logout callback to handle interceptor 401 failures
  useEffect(() => {
    window.__logoutCallback = handleSessionExpired;
    return () => {
      window.__logoutCallback = null;
    };
  }, [handleSessionExpired]);

  /**
   * On app load: Silent Session Check.
   * Fetches initial Access Token and user payload via HttpOnly refresh token validation.
   */
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await checkSession();
        if (res.data.user && res.data.accessToken) {
          setAccessToken(res.data.accessToken);
          setUser(res.data.user);
          setIsAuthenticated(true);
        } else {
          setAccessToken('');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Session verification failed:', error.message);
        setAccessToken('');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  /**
   * login — Calls backend with credentials (email, password, rememberMe).
   * Stores short-lived access token in-memory and sets HttpOnly cookie refresh token on server.
   */
  const login = useCallback(async (credentials) => {
    const res = await loginUser(credentials);
    if (res.data.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data.user; // Return user so caller can redirect based on role
  }, []);

  /**
   * register — Calls backend to create a new user profile.
   */
  const register = useCallback(async (data) => {
    const res = await registerUser(data);
    if (res.data.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data.user;
  }, []);

  /**
   * logout — Calls backend to clear cookies and revoke database sessions.
   */
  const logout = useCallback(async () => {
    try {
      // Unsubscribe from web push notifications before logging out
      await unsubscribeFromPush();
      await logoutUser();
    } catch (err) {
      console.warn('Backend logout call encountered an error:', err.message);
    } finally {
      // Always flush local session state
      setAccessToken('');
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const updateUser = useCallback((newData) => {
    setUser((prev) => (prev ? { ...prev, ...newData } : null));
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  // Show premium customized loading page until initial session check finishes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-sm tracking-wide">جاري التحقق من الجلسة الآمنة...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};
