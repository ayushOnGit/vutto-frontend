import axios from 'axios';
import { SettlementConfig } from '../types/SettlementConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://test.fitstok.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const settlementConfigAPI = {
  // Get all settlement configurations
  getAll: async (): Promise<SettlementConfig[]> => {
    const response = await api.get('/api/settlement-configs');
    return response.data as SettlementConfig[];
  },

  // Get settlement configuration by ID
  getById: async (id: number): Promise<SettlementConfig> => {
    const response = await api.get(`/api/settlement-configs/${id}`);
    return response.data as SettlementConfig;
  },

  // Create new settlement configuration
  create: async (config: Omit<SettlementConfig, 'id' | 'created_at' | 'updated_at'>): Promise<SettlementConfig> => {
    const response = await api.post('/api/settlement-configs', config);
    return response.data as SettlementConfig;
  },

  // Update settlement configuration
  update: async (id: number, config: Partial<SettlementConfig>): Promise<SettlementConfig> => {
    const response = await api.put(`/api/settlement-configs/${id}`, config);
    return response.data as SettlementConfig;
  },

  // Delete settlement configuration
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/settlement-configs/${id}`);
  },

  // Toggle active status
  toggleActive: async (id: number, is_active: boolean): Promise<SettlementConfig> => {
    const response = await api.patch(`/api/settlement-configs/${id}/toggle`, { is_active });
    return response.data as SettlementConfig;
  },

  // Clear all settlement configurations
  clearAll: async (): Promise<{ message: string; deletedCount: number }> => {
    const response = await api.delete('/api/settlement-configs/clear-all');
    return response.data as { message: string; deletedCount: number };
  },
};

export default api;
