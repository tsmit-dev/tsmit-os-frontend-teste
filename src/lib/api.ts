
import axios from 'axios';
import { ServiceOrder, Client, Role, User, ProvidedService, Status, EmailSettings } from './types';
import { toSnakeCase, toCamelCase } from './utils';

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

// --- Generic CRUD Factory ---
const createCrudFunctions = <T>(resource: string) => ({
  getAll: async (): Promise<T[]> => {
    const response = await api.get(`/${resource}`);
    return toCamelCase(response.data);
  },
  getById: async (id: string): Promise<T | null> => {
    const response = await api.get(`/${resource}/${id}`);
    return toCamelCase(response.data);
  },
  create: async (data: Partial<T>): Promise<T> => {
    const response = await api.post(`/${resource}`, toSnakeCase(data));
    return toCamelCase(response.data);
  },
  update: async (id: string, data: Partial<T>): Promise<T | null> => {
    const response = await api.put(`/${resource}/${id}`, toSnakeCase(data));
    return toCamelCase(response.data);
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/${resource}/${id}`);
  },
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

export const serviceOrderApi = {
    getAll: async (): Promise<ServiceOrder[]> => {
        const response = await api.get('/os');
        return toCamelCase(response.data);
    },
    getById: async (id: string): Promise<ServiceOrder | null> => {
        const response = await api.get(`/os/${id}`);
        return toCamelCase(response.data);
    },
    create: async (data: Partial<ServiceOrder>): Promise<ServiceOrder> => {
        const response = await api.post('/os', toSnakeCase(data));
        return toCamelCase(response.data);
    },
    update: async (id: string, data: Partial<ServiceOrder>): Promise<ServiceOrder | null> => {
        const response = await api.put(`/os/${id}`, toSnakeCase(data));
        return toCamelCase(response.data);
    },
    updateStatus: async (id: string, newStatusId: string, observation?: string): Promise<ServiceOrder | null> => {
        const response = await api.put(`/os/${id}/status`, { new_status_id: newStatusId, observation });
        return toCamelCase(response.data);
    },
};

export const clientApi = createCrudFunctions<Client>('clients');
export const roleApi = createCrudFunctions<Role>('roles');
export const userApi = createCrudFunctions<User>('users');
export const serviceApi = createCrudFunctions<ProvidedService>('services');
export const statusApi = createCrudFunctions<Status>('statuses');

export const settingsApi = {
    getEmailSettings: async(): Promise<EmailSettings> => {
        const response = await api.get('/settings/email');
        return toCamelCase(response.data);
    },
    updateEmailSettings: async(data: Partial<EmailSettings>): Promise<EmailSettings> => {
        const response = await api.put('/settings/email', toSnakeCase(data));
        return toCamelCase(response.data);
    }
}