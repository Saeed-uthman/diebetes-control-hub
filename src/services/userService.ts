/**
 * User Management Service (Admin)
 * 
 * Handles user CRUD operations for administrators.
 * Unwraps nested backend response keys.
 */

import api, { ApiResponse, unwrapData } from './api';
import { User, UserRole } from './authService';

export interface UserListParams {
  page?: number;
  per_page?: number;
  role?: UserRole;
  verified?: boolean;
  search?: string;
  sort_by?: 'name' | 'email' | 'created_at' | 'last_login';
  sort_order?: 'asc' | 'desc';
}

export interface UserStats {
  total: number;
  admin: number;
  infected: number;
  non_infected: number;
  verified: number;
  pending: number;
  new_this_month: number;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  role?: UserRole;
  verified?: boolean;
}

export const userService = {
  getAll: async (params?: UserListParams): Promise<ApiResponse<User[]>> => {
    return api.get<User[]>('/users', params as Record<string, string | number | boolean>);
  },

  getById: async (id: string | number): Promise<ApiResponse<User>> => {
    const response = await api.get<unknown>(`/users/${id}`);
    if (response.success && response.data) {
      response.data = unwrapData<User>(response.data, 'user');
    }
    return response as ApiResponse<User>;
  },

  update: async (id: string | number, data: UserUpdateData): Promise<ApiResponse<User>> => {
    const response = await api.put<unknown>(`/users/${id}`, data);
    if (response.success && response.data) {
      response.data = unwrapData<User>(response.data, 'user');
    }
    return response as ApiResponse<User>;
  },

  verify: async (id: string | number): Promise<ApiResponse<User>> => {
    const response = await api.put<unknown>(`/users/${id}/verify`);
    if (response.success && response.data) {
      response.data = unwrapData<User>(response.data, 'user');
    }
    return response as ApiResponse<User>;
  },

  changeRole: async (id: string | number, role: UserRole): Promise<ApiResponse<User>> => {
    const response = await api.put<unknown>(`/users/${id}/role`, { role });
    if (response.success && response.data) {
      response.data = unwrapData<User>(response.data, 'user');
    }
    return response as ApiResponse<User>;
  },

  delete: async (id: string | number): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/users/${id}`);
  },

  getStats: async (): Promise<ApiResponse<UserStats>> => {
    const response = await api.get<unknown>('/users/stats');
    if (response.success && response.data) {
      response.data = unwrapData<UserStats>(response.data, 'stats');
    }
    return response as ApiResponse<UserStats>;
  },

  getPending: async (): Promise<ApiResponse<User[]>> => {
    return api.get<User[]>('/users/pending');
  },
};

export default userService;
