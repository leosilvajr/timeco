import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('timeco-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('timeco-token');
      localStorage.removeItem('timeco-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (username, email, password, confirmPassword) => {
    const response = await api.post('/auth/register', { username, email, password, confirmPassword });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const sportService = {
  getAll: async () => {
    const response = await api.get('/sports');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/sports/${id}`);
    return response.data;
  },
};

export const playerService = {
  getAll: async () => {
    const response = await api.get('/players');
    return response.data;
  },
  create: async (name, skillLevel) => {
    const response = await api.post('/players', { name, skillLevel });
    return response.data;
  },
  update: async (id, name, skillLevel) => {
    const response = await api.put(`/players/${id}`, { name, skillLevel });
    return response.data;
  },
  delete: async (id) => {
    await api.delete(`/players/${id}`);
  },
};

export const gameService = {
  getAll: async () => {
    const response = await api.get('/games');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/games/${id}`);
    return response.data;
  },
  create: async (sportId, numberOfTeams, players) => {
    const response = await api.post('/games', { sportId, numberOfTeams, players });
    return response.data;
  },
  distributeTeams: async (sportId, numberOfTeams, players) => {
    const response = await api.post('/games/distribute', { sportId, numberOfTeams, players });
    return response.data;
  },
  delete: async (id) => {
    await api.delete(`/games/${id}`);
  },
};

export default api;
