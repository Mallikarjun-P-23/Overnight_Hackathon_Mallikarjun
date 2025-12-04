import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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
  getPrincipalStats: () => api.get('/dashboard/principal/stats'),
  getTeacherStats: () => api.get('/dashboard/teacher/stats'),
  getStudentStats: () => api.get('/dashboard/student/stats'),
  getStudents: () => api.get('/dashboard/students')
};

export default api;
