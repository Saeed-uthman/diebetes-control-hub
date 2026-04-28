/**
 * Education Content Service
 * 
 * Handles educational content management and user progress tracking.
 * Unwraps nested backend response keys.
 */

import api, { ApiResponse, unwrapData } from './api';

export type ContentType = 'article' | 'video' | 'guide';
export type TargetAudience = 'all' | 'infected' | 'non-infected';
export type ContentStatus = 'draft' | 'published' | 'archived';

export interface EducationContent {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  type: ContentType;
  target_audience: TargetAudience;
  author?: string;
  image?: string;
  thumbnail?: string;
  video_url?: string;
  duration?: string;
  read_time?: number;
  published_at?: string;
  status: ContentStatus;
  featured?: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
  user_progress?: {
    progress: number;
    completed: boolean;
    completed_at?: string;
  };
}

export interface EducationCreateData {
  title: string;
  description: string;
  content: string;
  category: string;
  type: ContentType;
  target_audience?: TargetAudience;
  image?: string;
  video_url?: string;
  read_time?: number;
  status?: ContentStatus;
  tags?: string[];
}

export interface EducationUpdateData extends Partial<EducationCreateData> {}

export interface EducationListParams {
  category?: string;
  type?: ContentType;
  search?: string;
  status?: ContentStatus;
  page?: number;
  per_page?: number;
}

export interface ProgressUpdateData {
  progress: number;
  completed?: boolean;
}

export const educationService = {
  getAll: async (params?: EducationListParams): Promise<ApiResponse<EducationContent[]>> => {
    return api.get<EducationContent[]>('/education', params as Record<string, string | number | boolean>);
  },

  getById: async (id: string | number): Promise<ApiResponse<EducationContent>> => {
    const response = await api.get<unknown>(`/education/${id}`);
    if (response.success && response.data) {
      response.data = unwrapData<EducationContent>(response.data, 'content');
    }
    return response as ApiResponse<EducationContent>;
  },

  create: async (data: EducationCreateData): Promise<ApiResponse<EducationContent>> => {
    const response = await api.post<unknown>('/education', data);
    if (response.success && response.data) {
      response.data = unwrapData<EducationContent>(response.data, 'content');
    }
    return response as ApiResponse<EducationContent>;
  },

  update: async (id: string | number, data: EducationUpdateData): Promise<ApiResponse<EducationContent>> => {
    const response = await api.put<unknown>(`/education/${id}`, data);
    if (response.success && response.data) {
      response.data = unwrapData<EducationContent>(response.data, 'content');
    }
    return response as ApiResponse<EducationContent>;
  },

  delete: async (id: string | number): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/education/${id}`);
  },

  getCategories: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get<unknown>('/education/categories');
    if (response.success && response.data) {
      response.data = unwrapData<string[]>(response.data, 'categories');
    }
    return response as ApiResponse<string[]>;
  },

  updateProgress: async (id: string | number, data: ProgressUpdateData): Promise<ApiResponse<void>> => {
    return api.put<void>(`/education/${id}/progress`, data);
  },

  getCompleted: async (): Promise<ApiResponse<EducationContent[]>> => {
    return api.get<EducationContent[]>('/education/completed');
  },
};

export default educationService;
