// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// API services for each entity
export const userService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData)
};

export const adminService = {
  login: (credentials) => api.post('/auth/admin/login', credentials)
};

export const transportService = {
  getAll: () => api.get('/transport'),
  getById: (id) => api.get(`/transport/${id}`),
  create: (data) => api.post('/transport', data),
  update: (id, data) => api.put(`/transport/${id}`, data),
  delete: (id) => api.delete(`/transport/${id}`)
};

export const routeService = {
  getAll: () => api.get('/routes'),
  getById: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`)
};
