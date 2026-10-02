import * as store from './store';
import type { UserRecord } from './store';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UserBiometricCheck {
  exists: boolean;
  name?: string;
  employee_id?: string;
  isEnrolled: boolean;
  status: 'NOT_ENROLLED' | 'ENROLLED' | 'REVOKED';
  livenessChallenge: 'blink' | 'turn_left' | 'turn_right' | 'smile';
  challengeToken: string;
}

export const AuthService = {
  getRedirectPath(user: UserRecord): string {
    const role = user.profile.role;
    if (role === 'admin') return '/admin';
    if (role === 'trainer') return '/trainer';
    return '/dashboard';
  },

  async loginWithPassword(email: string, password: string): Promise<{ user: UserRecord; redirectUrl: string }> {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password }, { timeout: 4000 });
      if (res.data?.access_token) {
        localStorage.setItem('statwise_token', res.data.access_token);
        if (res.data.user) {
          localStorage.setItem('statwise_user', JSON.stringify(res.data.user));
        }
      }
    } catch {
      // Backend offline or fallback
    }

    const user = store.loginUser(email, password);
    const redirectUrl = this.getRedirectPath(user);
    return { user, redirectUrl };
  },

  async registerUser(data: any): Promise<UserRecord> {
    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/register`,
        {
          name: data.name,
          email: data.email,
          password: data.password,
          employee_id: data.employee_id || data.employeeId,
          role: 'employee',
          designation: data.designation || 'Statistical Officer',
          department_id: 1,
          years_experience: Number(data.years_experience) || 1.0,
          education: data.education || 'Graduate in Statistics / Economics',
          career_goal: data.career_goal || 'Enhance statistical competencies for official reporting',
        },
        { timeout: 5000 }
      );
      if (res.data?.access_token) {
        localStorage.setItem('statwise_token', res.data.access_token);
        if (res.data.user) {
          localStorage.setItem('statwise_user', JSON.stringify(res.data.user));
        }
      }
    } catch {
      // Backend fallback
    }

    const record = store.registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      employee_id: data.employee_id || data.employeeId,
      designation: data.designation || 'Statistical Officer',
      department: data.department || data.department_name || 'National Statistical Office',
      years_experience: Number(data.years_experience) || 0,
      education: data.education || '',
      current_assignment: data.current_assignment || '',
      career_goal: data.career_goal || '',
    });
    return record;
  },

  async checkUserBiometricStatus(identifier: string): Promise<UserBiometricCheck> {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/biometric/check-user`, { identifier }, { timeout: 3500 });
      if (res.data) {
        return {
          exists: res.data.exists,
          name: res.data.name,
          employee_id: res.data.employee_id,
          isEnrolled: res.data.face_enrollment_status === 'ENROLLED' && res.data.face_authentication_enabled,
          status: res.data.face_enrollment_status as any,
          livenessChallenge: res.data.liveness_challenge || 'blink',
          challengeToken: res.data.challenge_token || '',
        };
      }
    } catch {
      // Backend fallback to local store
    }

    store.initializeStore();
    const users = store.getAllUsers();
    const norm = identifier.toLowerCase().trim();
    const found = users.find(
      u => u.profile.email.toLowerCase() === norm ||
           u.profile.employee_id.toLowerCase() === norm ||
           u.profile.id.toLowerCase() === norm
    );

    if (!found) {
      return {
        exists: false,
        isEnrolled: false,
        status: 'NOT_ENROLLED',
        livenessChallenge: 'blink',
        challengeToken: '',
      };
    }

    const isEnrolled = !!(
      (found.faceEnrolled || found.profile.faceEnrolled) &&
      (found.faceTemplate || found.profile.faceTemplate) &&
      found.faceEnrollmentStatus !== 'REVOKED'
    );

    return {
      exists: true,
      name: found.profile.name,
      employee_id: found.profile.employee_id,
      isEnrolled,
      status: isEnrolled ? 'ENROLLED' : (found.faceEnrollmentStatus || 'NOT_ENROLLED'),
      livenessChallenge: 'blink',
      challengeToken: `local-token-${Date.now()}`,
    };
  },

  async loginWithFace(
    identifier: string,
    liveFaceTemplate?: string,
    options?: {
      challengeToken?: string;
      livenessResponse?: string;
      simulateFailure?: boolean;
    }
  ): Promise<{ user: UserRecord; redirectUrl: string }> {
    if (options?.simulateFailure) {
      throw new Error('Face verification was unsuccessful. Please make sure your face is clearly visible and try again.');
    }

    // Try backend verification first
    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/biometric/verify`,
        {
          identifier,
          live_template: liveFaceTemplate,
          challenge_token: options?.challengeToken,
          liveness_response: options?.livenessResponse,
        },
        { timeout: 5000 }
      );

      if (res.data?.access_token) {
        localStorage.setItem('statwise_token', res.data.access_token);
        // Sync local store
        const user = store.loginWithFaceStore(identifier, liveFaceTemplate);
        return { user, redirectUrl: res.data.redirect_url || this.getRedirectPath(user) };
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 400 || err.response?.status === 429) {
        throw new Error(err.response?.data?.detail || 'Face verification was unsuccessful. Please make sure your face is clearly visible and try again.');
      }
      // If network failure or backend unreachable, fall back to local store
    }

    const user = store.loginWithFaceStore(identifier, liveFaceTemplate);
    const redirectUrl = this.getRedirectPath(user);
    return { user, redirectUrl };
  },

  async enrollFace(
    userId: string,
    template: string,
    thumbnail?: string,
    consent: boolean = true
  ): Promise<UserRecord> {
    const updated = store.enrollUserFace(userId, template, thumbnail);

    // Also attempt backend enrollment if token exists
    try {
      const token = localStorage.getItem('statwise_token');
      if (token) {
        await axios.post(
          `${API_BASE}/api/auth/biometric/enroll`,
          {
            template,
            consent,
            consent_version: 'v1.0',
            quality_score: 95.0,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }
        );
      }
    } catch {
      // Backend sync error silently ignored for prototype
    }

    return updated;
  },

  async disableFace(userId: string): Promise<UserRecord> {
    const updated = store.disableFaceEnrollment(userId);
    try {
      const token = localStorage.getItem('statwise_token');
      if (token) {
        await axios.post(
          `${API_BASE}/api/auth/biometric/disable`,
          {},
          { headers: { Authorization: `Bearer ${token}` }, timeout: 4000 }
        );
      }
    } catch {
      // Fallback
    }
    return updated;
  },

  async resetFace(userIdOrEmail: string): Promise<UserRecord | null> {
    const user = store.getUserById(userIdOrEmail) ||
      store.getAllUsers().find(u => u.profile.email.toLowerCase() === userIdOrEmail.toLowerCase() || u.profile.employee_id.toLowerCase() === userIdOrEmail.toLowerCase());
    
    if (user) {
      store.resetFaceEnrollment(user.profile.id);
    }

    try {
      await axios.post(
        `${API_BASE}/api/auth/biometric/dev-reset`,
        { identifier: userIdOrEmail },
        { timeout: 4000 }
      );
    } catch {
      // Fallback
    }

    return user ? store.getUserById(user.profile.id) : null;
  },
};
