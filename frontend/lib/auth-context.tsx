'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as store from '@/lib/store';

// ─── Types ────────────────────────────────────────────────────────────────────

// Matches the shape all pages expect from useAuth()
export interface User {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  role: 'employee' | 'trainer' | 'admin';
  designation: string;
  department?: { id: number; name: string; code: string };
  years_experience: number;
  education: string;
  career_goal: string;
  current_assignment: string;
  assessmentCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // kept for API compatibility (AI assistant, quiz generator)
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoUser: (userId: string) => void;
  resetUserData: () => void;
  isLoading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

function recordToUser(record: store.UserRecord): User {
  return {
    id: record.profile.id,
    name: record.profile.name,
    email: record.profile.email,
    employee_id: record.profile.employee_id,
    role: record.profile.role,
    designation: record.profile.designation,
    department: {
      id: 1,
      name: record.profile.department,
      code: record.profile.department.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4),
    },
    years_experience: record.profile.years_experience,
    education: record.profile.education,
    career_goal: record.profile.career_goal,
    current_assignment: record.profile.current_assignment,
    assessmentCompleted: record.assessmentCompleted,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    store.initializeStore();
    const record = store.getCurrentUser();
    if (record) setUser(recordToUser(record));

    // Restore any existing backend token for AI features
    const savedToken = localStorage.getItem('statwise_token') || localStorage.getItem('statsetu_token');
    if (savedToken) setToken(savedToken);

    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const record = store.loginUser(email, password);
    setUser(recordToUser(record));
  }, []);

  const register = useCallback(async (data: any) => {
    const record = store.registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || 'employee',
      designation: data.designation || 'Statistical Officer',
      department: data.department || data.department_name || 'Department of Statistics',
      years_experience: Number(data.years_experience) || 0,
      education: data.education || '',
      current_assignment: data.current_assignment || '',
      career_goal: data.career_goal || '',
    });
    setUser(recordToUser(record));
  }, []);

  const logout = useCallback(() => {
    store.logoutUser();
    setUser(null);
    // Also clear any backend token
    localStorage.removeItem('statwise_token');
    localStorage.removeItem('statwise_user');
    localStorage.removeItem('statsetu_token');
    localStorage.removeItem('statsetu_user');
    window.location.href = '/login';
  }, []);

  const switchDemoUser = useCallback((userId: string) => {
    store.switchDemoUser(userId);
    const record = store.getCurrentUser();
    if (record) {
      setUser(recordToUser(record));
      // Force page reload to refresh all data
      window.location.href = '/dashboard';
    }
  }, []);

  const resetUserData = useCallback(() => {
    if (!user) return;
    store.resetUserData(user.id);
    const record = store.getCurrentUser();
    if (record) setUser(recordToUser(record));
    window.location.href = '/dashboard';
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, switchDemoUser, resetUserData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
