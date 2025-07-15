
import axios from 'axios';
import { ServiceOrder, Client, Role, User, ProvidedService, Status, EmailSettings } from './types';

const api = axios.create({
  baseURL: 'https://tsmit-os-backend-node.netlify.app',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to handle response data
const handleResponse = (response: any) => response.data;

// Generic CRUD factory
const createCrudService = <T>(resource: string) => ({
  getAll: (): Promise<T[]> => api.get(`/${resource}`).then(handleResponse),
  getById: (id: string): Promise<T> => api.get(`/${resource}/${id}`).then(handleResponse),
  create: (data: Partial<T>): Promise<T> => api.post(`/${resource}`, data).then(handleResponse),
  update: (id: string, data: Partial<T>): Promise<T> => api.put(`/${resource}/${id}`, data).then(handleResponse),
  remove: (id: string): Promise<void> => api.delete(`/${resource}/${id}`).then(handleResponse),
});

// --- API Resources ---
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token } = response.data.session;
    localStorage.setItem('access_token', access_token);
    return response.data;
  },
  register: async (name: string, email: string, password: string, roleId: string) => {
    return await api.post('/auth/register', { name, email, password, roleId });
  },
  getMe: async () => {
    return await api.get('/auth/me');
  },
  logout: () => {
    localStorage.removeItem('access_token');
  },
};

export const osApi = {
  ...createCrudService<ServiceOrder>('os'),
  updateStatus: (id: string, newStatusId: string, observation?: string): Promise<ServiceOrder> => {
    return api.put(`/os/${id}/status`, { newStatusId, observation }).then(handleResponse);
  }
};

export const clientsApi = createCrudService<Client>('clients');
export const rolesApi = createCrudService<Role>('roles');
export const usersApi = createCrudService<User>('users');
export const servicesApi = createCrudService<ProvidedService>('services');
export const statusesApi = createCrudService<Status>('statuses');

export const settingsApi = {
  getEmailSettings: (): Promise<EmailSettings> => api.get('/settings/email').then(handleResponse),
  updateEmailSettings: (data: EmailSettings): Promise<EmailSettings> => api.put('/settings/email', data).then(handleResponse),
};
