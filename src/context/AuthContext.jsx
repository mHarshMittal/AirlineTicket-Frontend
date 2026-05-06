import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || null);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);

  // login ke baad token save karo
  function login(token, email, role) {
    localStorage.setItem('token', token);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userRole', role);
    setToken(token);
    setUserEmail(email);
    setUserRole(role);
  }

  // logout karo - sab clear karo
  function logout() {
    localStorage.clear();
    setToken(null);
    setUserEmail(null);
    setUserRole(null);
  }

  const isLoggedIn = !!token;

  return (
    <AuthContext.Provider value={{ token, userEmail, userRole, login, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
}

// custom hook - easy use ke liye
export function useAuth() {
  return useContext(AuthContext);
}
