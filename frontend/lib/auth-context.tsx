'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as store from '@/lib/store';
import { AuthService } from '@/lib/auth-service';

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
  onboardingCompleted: boolean;
  faceEnrolled: boolean;
  faceTemplate?: string;
  faceEnrolledAt?: string;
  enrolledFaceThumbnail?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // kept for API compatibility (AI assistant, quiz generator)
  login: (email: string, password: string) => Promise<string>;
  loginWithFace: (officerId: string, liveFaceTemplate?: string, options?: { simulateFailure?: boolean }) => Promise<string>;
  enrollFace: (template: string, thumbnail?: string) => Promise<void>;
  refreshUser: () => void;
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
    onboardingCompleted: record.onboardingCompleted ?? record.assessmentCompleted,
    faceEnrolled: record.faceEnrolled ?? record.profile.faceEnrolled ?? false,
    faceTemplate: record.faceTemplate ?? record.profile.faceTemplate,
    faceEnrolledAt: record.faceEnrolledAt ?? record.profile.faceEnrolledAt,
    enrolledFaceThumbnail: record.enrolledFaceThumbnail ?? record.profile.enrolledFaceThumbnail,
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

  const refreshUser = useCallback(() => {
    const record = store.getCurrentUser();
    if (record) setUser(recordToUser(record));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string> => {
    const res = await AuthService.loginWithPassword(email, password);
    setUser(recordToUser(res.user));
    return res.redirectUrl;
  }, []);

  const loginWithFace = useCallback(async (officerId: string, liveFaceTemplate?: string, options?: { simulateFailure?: boolean }): Promise<string> => {
    const res = await AuthService.loginWithFace(officerId, liveFaceTemplate, options);
    setUser(recordToUser(res.user));
    return res.redirectUrl;
  }, []);

  const enrollFace = useCallback(async (template: string, thumbnail?: string) => {
    if (!user) throw new Error('No authenticated user session found to enroll face.');
    const updated = await AuthService.enrollFace(user.id, template, thumbnail);
    setUser(recordToUser(updated));
  }, [user]);

  const register = useCallback(async (data: any) => {
    const record = store.registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      employee_id: data.employee_id || data.employeeId,
      // role is intentionally omitted — store always assigns 'employee' for self-registration
      designation: data.designation || 'Statistical Officer',
      department: data.department || data.department_name || 'National Statistical Office',
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
      // Route to the correct role-based destination
      const role = record.profile.role;
      const isOnboarded = record.onboardingCompleted ?? record.assessmentCompleted ?? false;
      let dest = '/dashboard';
      if (role === 'admin') dest = '/admin';
      else if (role === 'trainer') dest = '/trainer';
      else if (!isOnboarded) dest = '/onboarding';
      window.location.href = dest;
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
    <AuthContext.Provider value={{ user, token, login, loginWithFace, enrollFace, refreshUser, register, logout, switchDemoUser, resetUserData, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
