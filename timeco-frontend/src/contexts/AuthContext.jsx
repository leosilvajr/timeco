import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('timeco-token');
    const savedUser = localStorage.getItem('timeco-user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    localStorage.setItem('timeco-token', data.token);
    localStorage.setItem('timeco-user', JSON.stringify({
      username: data.username,
      email: data.email,
      role: data.role,
    }));
    setUser({
      username: data.username,
      email: data.email,
      role: data.role,
    });
    return data;
  };

  const register = async (username, email, password, confirmPassword) => {
    const data = await authService.register(username, email, password, confirmPassword);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('timeco-token');
    localStorage.removeItem('timeco-user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
