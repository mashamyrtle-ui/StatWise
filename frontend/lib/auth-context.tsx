'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as store from '@/lib/store';
import { AuthService, UserBiometricCheck } from '@/lib/auth-service';

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
  faceAuthenticationEnabled: boolean;
  faceEnrollmentStatus: 'NOT_ENROLLED' | 'ENROLLED' | 'REVOKED';
  faceTemplate?: string;
  faceEnrolledAt?: string;
  enrolledFaceThumbnail?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<string>;
  loginWithFace: (
    identifier: string,
    liveFaceTemplate?: string,
    options?: { challengeToken?: string; livenessResponse?: string; simulateFailure?: boolean }
  ) => Promise<string>;
  checkUserBiometricStatus: (identifier: string) => Promise<UserBiometricCheck>;
  enrollFace: (template: string, thumbnail?: string, consent?: boolean) => Promise<void>;
  disableFace: () => Promise<void>;
  resetFace: (userIdOrEmail: string) => Promise<void>;
  refreshUser: () => void;
  register: (data: any) => Promise<User>;
  logout: () => void;
  switchDemoUser: (userId: string) => void;
  resetUserData: () => void;
  isLoading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

function recordToUser(record: store.UserRecord): User {
  const isEnrolled = !!(
    (record.faceEnrolled || record.profile.faceEnrolled) &&
    (record.faceTemplate || record.profile.faceTemplate) &&
    record.faceEnrollmentStatus !== 'REVOKED'
  );

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
    faceEnrolled: isEnrolled,
    faceAuthenticationEnabled: isEnrolled && (record.faceAuthenticationEnabled ?? record.profile.faceAuthenticationEnabled ?? true),
    faceEnrollmentStatus: isEnrolled ? 'ENROLLED' : (record.faceEnrollmentStatus || record.profile.faceEnrollmentStatus || 'NOT_ENROLLED'),
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

  const checkUserBiometricStatus = useCallback(async (identifier: string): Promise<UserBiometricCheck> => {
    return AuthService.checkUserBiometricStatus(identifier);
  }, []);

  const loginWithFace = useCallback(async (
    identifier: string,
    liveFaceTemplate?: string,
    options?: { challengeToken?: string; livenessResponse?: string; simulateFailure?: boolean }
  ): Promise<string> => {
    const res = await AuthService.loginWithFace(identifier, liveFaceTemplate, options);
    setUser(recordToUser(res.user));
    return res.redirectUrl;
  }, []);

  const enrollFace = useCallback(async (template: string, thumbnail?: string, consent: boolean = true) => {
    if (!user) throw new Error('No authenticated user session found to enroll face.');
    const updated = await AuthService.enrollFace(user.id, template, thumbnail, consent);
    setUser(recordToUser(updated));
  }, [user]);

  const disableFace = useCallback(async () => {
    if (!user) throw new Error('No authenticated user session found.');
    const updated = await AuthService.disableFace(user.id);
    setUser(recordToUser(updated));
  }, [user]);

  const resetFace = useCallback(async (userIdOrEmail: string) => {
    const updated = await AuthService.resetFace(userIdOrEmail);
    if (updated && user && user.id === updated.profile.id) {
      setUser(recordToUser(updated));
    } else {
      refreshUser();
    }
  }, [user, refreshUser]);

  const register = useCallback(async (data: any): Promise<User> => {
    const record = await AuthService.registerUser(data);
    const mapped = recordToUser(record);
    setUser(mapped);
    return mapped;
  }, []);

  const logout = useCallback(() => {
    store.logoutUser();
    setUser(null);
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
      const role = record.profile.role;
      let dest = '/dashboard';
      if (role === 'admin') dest = '/admin';
      else if (role === 'trainer') dest = '/trainer';
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
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        loginWithFace,
        checkUserBiometricStatus,
        enrollFace,
        disableFace,
        resetFace,
        refreshUser,
        register,
        logout,
        switchDemoUser,
        resetUserData,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
