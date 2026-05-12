import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, logoutUser, getMe, registerUser } from '../api/authApi';
import { unsubscribeFromPush } from '../utils/pushNotifications';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // true until we verify session

  /**
   * On app load: call /api/auth/me to verify the HTTP-only cookie.
   * This is the only reliable way — we cannot read the cookie from JS.
   */
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await getMe();
        setUser(res.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        // Cookie invalid or missing — user is logged out
        // Suppress 401 errors in console as they're expected when not logged in
        if (error.response?.status !== 401) {
          console.error('Session verification failed:', error.message);
        }
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  /**
   * login — call backend, store user in state from response.
   * The JWT is stored in an HTTP-only cookie by the server.
   */
  const login = useCallback(async (credentials) => {
    const res = await loginUser(credentials);
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data.user; // Return user so caller can redirect based on role
  }, []);

  /**
   * register — call backend, store user in state from response.
   */
  const register = useCallback(async (data) => {
    const res = await registerUser(data);
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data.user;
  }, []);

  /**
   * logout — call backend to clear cookie, then clear local state.
   * Also removes push notification subscription.
   */
  const logout = useCallback(async () => {
    try {
      // Unsubscribe from push before logging out
      await unsubscribeFromPush();
      await logoutUser();
    } catch {
      // Even if request fails, clear local state
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);


  const updateUser = useCallback((newData) => {
    setUser(prev => ({ ...prev, ...newData }));
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

  // Show nothing until session verification completes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Loading MedCore...</p>
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
