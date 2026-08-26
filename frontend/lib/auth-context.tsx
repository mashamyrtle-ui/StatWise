'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  employee_id: string;
  role: 'employee' | 'trainer' | 'admin';
  designation?: string;
  department_id?: number;
  department?: { id: number; name: string; code: string };
  years_experience?: number;
  education?: string;
  career_goal?: string;
  current_assignment?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('statwise_token') || localStorage.getItem('statsetu_token');
    const savedUser = localStorage.getItem('statwise_user') || localStorage.getItem('statsetu_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { access_token, user: userData } = response.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('statwise_token', access_token);
    localStorage.setItem('statwise_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('statwise_token');
    localStorage.removeItem('statwise_user');
    localStorage.removeItem('statsetu_token');
    localStorage.removeItem('statsetu_user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
