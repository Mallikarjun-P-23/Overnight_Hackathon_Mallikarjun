import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  login: (email, password) => api.post('/auth/login', { email, password })
};

export const dashboardAPI = {
  getPrincipalStats: (selectedClass) => api.get('/dashboard/principal/stats', { params: { selectedClass } }),
  getTeacherStats: () => api.get('/dashboard/teacher/stats'),
  getStudentStats: () => api.get('/dashboard/student/stats'),
  getStudents: () => api.get('/dashboard/students'),
  postAnnouncement: (data) => api.post('/dashboard/principal/announcement', data),
  createQuiz: (data) => api.post('/dashboard/teacher/quiz', data),
  getReminders: () => api.get('/dashboard/teacher/reminders'),
  createReminder: (data) => api.post('/dashboard/teacher/reminder', data),
  getTeacherReports: () => api.get('/dashboard/teacher/reports'),
  getStudentAnalytics: (id) => api.get(`/dashboard/teacher/student/${id}`),
  getStudentQuizzes: () => api.get('/dashboard/student/quizzes'),
  aiHelper: (data) => api.post('/dashboard/student/ai-helper', data),
  videoConvert: () => api.post('/dashboard/student/video-convert'),
  getForumPosts: (params) => api.get('/forum', { params }),
  createForumPost: (data) => api.post('/forum', data),
  replyToForumPost: (id, data) => api.post(`/forum/${id}/reply`, data)
};

export const quizResultsAPI = {
  submitQuiz: (data) => api.post('/quiz-results/submit', data),
  getQuizHistory: (params) => api.get('/quiz-results/history', { params }),
  getAnalytics: (params) => api.get('/quiz-results/analytics', { params }),
  getLeaderboard: (params) => api.get('/quiz-results/leaderboard', { params })
};

export default api;
