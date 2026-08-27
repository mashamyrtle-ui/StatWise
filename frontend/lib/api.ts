import axios from 'axios';
import API_BASE from './config';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('statwise_token') || localStorage.getItem('statsetu_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('statwise_token');
      localStorage.removeItem('statwise_user');
      localStorage.removeItem('statsetu_token');
      localStorage.removeItem('statsetu_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    designation?: string;
    department_id?: number;
    years_experience?: number;
    education?: string;
    career_goal?: string;
  }) => api.post('/api/auth/register', data),
  getDepartments: () => api.get('/api/auth/departments'),
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const usersApi = {
  getMe: () => api.get('/api/users/me'),
  getUser: (id: number) => api.get(`/api/users/${id}`),
  updateUser: (id: number, data: any) => api.patch(`/api/users/${id}`, data),
  listUsers: () => api.get('/api/users'),
};

// ─── Competencies ─────────────────────────────────────────────────────────────
export const competenciesApi = {
  list: () => api.get('/api/competencies'),
  getUserCompetencies: (userId: number) => api.get(`/api/users/${userId}/competencies`),
  getSkillGaps: (userId: number) => api.get(`/api/skill-gaps/${userId}`),
};

// ─── Assessments ──────────────────────────────────────────────────────────────
export const assessmentsApi = {
  list: () => api.get('/api/assessments'),
  getDiagnostic: () => api.get('/api/assessments/diagnostic'),
  get: (id: number) => api.get(`/api/assessments/${id}`),
  submit: (id: number, answers: Record<string, string>, timeTaken?: number) =>
    api.post(`/api/assessments/${id}/submit`, { answers, time_taken_seconds: timeTaken }),
};

// ─── Courses ──────────────────────────────────────────────────────────────────
export const coursesApi = {
  list: (params?: { provider?: string; difficulty?: string; category?: string; search?: string }) =>
    api.get('/api/courses', { params }),
  get: (id: number) => api.get(`/api/courses/${id}`),
  enroll: (courseId: number) => api.post(`/api/courses/${courseId}/enroll`),
};

// ─── Recommendations ─────────────────────────────────────────────────────────
export const recommendationsApi = {
  get: (userId: number, recalculate?: boolean) =>
    api.get(`/api/recommendations/${userId}`, { params: { recalculate } }),
};

// ─── Learning Path & History ─────────────────────────────────────────────────
export const learningApi = {
  getPath: (userId: number) => api.get(`/api/learning-path/${userId}`),
  getHistory: (userId: number) => api.get(`/api/learning-history/${userId}`),
};

// ─── Materials & Quizzes ─────────────────────────────────────────────────────
export const materialsApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/api/materials/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: () => api.get('/api/materials'),
};

export const quizzesApi = {
  generate: (materialId: number, count: number, difficulty: string, competencyFocus?: string) =>
    api.post('/api/quizzes/generate', {
      material_id: materialId,
      question_count: count,
      difficulty,
      competency_focus: competencyFocus,
    }),
  list: () => api.get('/api/quizzes'),
  get: (id: number) => api.get(`/api/quizzes/${id}`),
  publish: (id: number) => api.post(`/api/quizzes/${id}/publish`),
  updateQuestion: (quizId: number, questionId: number, data: any) =>
    api.patch(`/api/quizzes/${quizId}/questions/${questionId}`, data),
  deleteQuestion: (quizId: number, questionId: number) =>
    api.delete(`/api/quizzes/${quizId}/questions/${questionId}`),
  submit: (id: number, answers: Record<string, string>, timeTaken?: number) =>
    api.post(`/api/quizzes/${id}/submit`, { answers, time_taken_seconds: timeTaken }),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  organization: () => api.get('/api/analytics/organization'),
  notifications: (userId: number) => api.get(`/api/analytics/notifications/${userId}`),
  markRead: (notifId: number) => api.patch(`/api/analytics/notifications/${notifId}/read`),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  send: (message: string, history: any[]) =>
    api.post('/api/chat', { message, conversation_history: history }),
};

export default api;
