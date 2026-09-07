import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface AuthUser {
  id?: string;
  email?: string;
  role: string;
  tenantId: string | null;
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:3000/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
         const freshUser = res.data;
         localStorage.setItem('user', JSON.stringify(freshUser));
         setUser(freshUser);
      }).catch(err => {
         console.error('Failed to refresh user session', err);
      });
    }
  }, [token]);

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

    const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
