import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext useEffect:', { token, userRole });
    if (token) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, [token]);

  const login = (token, role) => {
    setToken(token);
    setUserRole(role);
    setIsLoggedIn(true);
    localStorage.setItem('token', token);
    localStorage.setItem('userRole', role);
  };

  const logout = () => {
    setToken(null);
    setUserRole(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  };

  const value = {
    isLoggedIn,
    token,
    userRole,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
