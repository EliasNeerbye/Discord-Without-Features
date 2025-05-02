import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get('/users/profile');
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    try {
      await api.post('/auth/login', credentials);
      const response = await api.get('/users/profile');
      setUser(response.data);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      await api.post('/auth/register', userData);
      const response = await api.get('/users/profile');
      setUser(response.data);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      await api.delete('/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed'
      };
    }
  };

  const updateProfile = async (userData) => {
    try {
      await api.put('/users/profile', userData);
      const response = await api.get('/users/profile');
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      };
    }
  };

  const uploadAvatar = async (formData) => {
    try {
      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const updatedUser = { ...user, avatarUrl: response.data.avatarUrl };
      setUser(updatedUser);
      return { success: true, avatarUrl: response.data.avatarUrl };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Avatar upload failed'
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    uploadAvatar
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};