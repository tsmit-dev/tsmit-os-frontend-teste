
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  const { access_token } = response.data.session;
  localStorage.setItem('access_token', access_token);
  return response.data;
};

export const register = async (name, email, password, roleId) => {
  return await api.post('/auth/register', { name, email, password, roleId });
};

export const getMe = async () => {
  return await api.get('/auth/me');
};

export const logout = () => {
  localStorage.removeItem('access_token');
};
  