import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  getCurrentUser,
  updateUserProfile,
  logoutUser
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('chatbox_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('chatbox_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('chatbox_token');
      if (storedToken) {
        try {
          const res = await getCurrentUser();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('chatbox_user', JSON.stringify(res.data));
          }
        } catch (error) {
          console.error('[Auth] Token verification failed:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (identifier, password) => {
    const res = await loginUser({ identifier, password });
    if (res.success && res.data) {
      const { user: userData, token: userToken } = res.data;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('chatbox_token', userToken);
      localStorage.setItem('chatbox_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await registerUser(formData);
    if (res.success && res.data) {
      const { user: userData, token: userToken } = res.data;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('chatbox_token', userToken);
      localStorage.setItem('chatbox_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = async () => {
    try {
      if (token) {
        await logoutUser();
      }
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('chatbox_token');
      localStorage.removeItem('chatbox_user');
    }
  };

  const updateProfile = async (data) => {
    const res = await updateUserProfile(data);
    if (res.success && res.data) {
      setUser(res.data);
      localStorage.setItem('chatbox_user', JSON.stringify(res.data));
      return res.data;
    }
    throw new Error(res.message || 'Profile update failed');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

