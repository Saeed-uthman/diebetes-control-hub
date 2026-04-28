/**
 * Exercise & Activity Service
 * 
 * Handles exercise library and activity tracking.
 * Unwraps nested backend response keys.
 */

import api, { ApiResponse, unwrapData } from './api';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  duration: number;
  calories: number;
  category: string;
  difficulty: Difficulty;
  equipment: string[];
  instructions: string[];
  muscle_groups?: string[];
  image?: string;
  video_url?: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  date: string;
  type: 'steps' | 'exercise' | 'workout';
  value: number;
  exercise_id?: string;
  exercise_name?: string;
  duration?: number;
  calories_burned?: number;
  notes?: string;
  created_at: string;
}

export interface ActivityCreateData {
  type: 'steps' | 'exercise' | 'workout';
  value: number;
  exercise_id?: string;
  duration?: number;
  notes?: string;
  date?: string;
}

export interface WeeklySummary {
  total_steps: number;
  total_workouts: number;
  workouts_completed: number;
  total_duration: number;
  total_active_minutes: number;
  total_calories: number;
  total_calories_burned: number;
  daily_breakdown: {
    date: string;
    steps: number;
    workouts: number;
    duration: number;
    calories: number;
  }[];
  goal_progress: {
    steps: { current: number; goal: number; percentage: number };
    workouts: { current: number; goal: number; percentage: number };
  };
}

export interface ActivityStats {
  total_activities: number;
  this_week_activities: number;
  total_calories_burned: number;
  average_daily_steps: number;
  favorite_exercise?: string;
  streak_days: number;
}

export interface ExerciseListParams {
  category?: string;
  difficulty?: Difficulty;
  search?: string;
  page?: number;
  per_page?: number;
}

export const exerciseService = {
  getAll: async (params?: ExerciseListParams): Promise<ApiResponse<Exercise[]>> => {
    return api.get<Exercise[]>('/exercises', params as Record<string, string | number | boolean>);
  },

  getById: async (id: string | number): Promise<ApiResponse<Exercise>> => {
    const response = await api.get<unknown>(`/exercises/${id}`);
    if (response.success && response.data) {
      response.data = unwrapData<Exercise>(response.data, 'exercise');
    }
    return response as ApiResponse<Exercise>;
  },

  getCategories: async (): Promise<ApiResponse<string[]>> => {
    const response = await api.get<unknown>('/exercises/categories');
    if (response.success && response.data) {
      response.data = unwrapData<string[]>(response.data, 'categories');
    }
    return response as ApiResponse<string[]>;
  },

  getActivityLog: async (params?: { start_date?: string; end_date?: string }): Promise<ApiResponse<ActivityLog[]>> => {
    return api.get<ActivityLog[]>('/activity', params as Record<string, string | number | boolean>);
  },

  logActivity: async (data: ActivityCreateData): Promise<ApiResponse<ActivityLog>> => {
    const response = await api.post<unknown>('/activity', data);
    if (response.success && response.data) {
      response.data = unwrapData<ActivityLog>(response.data, 'activity');
    }
    return response as ApiResponse<ActivityLog>;
  },

  deleteActivity: async (id: string | number): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/activity/${id}`);
  },

  getWeeklySummary: async (): Promise<ApiResponse<WeeklySummary>> => {
    const response = await api.get<unknown>('/activity/weekly');
    if (response.success && response.data) {
      response.data = unwrapData<WeeklySummary>(response.data, 'summary');
    }
    return response as ApiResponse<WeeklySummary>;
  },

  getStats: async (): Promise<ApiResponse<ActivityStats>> => {
    const response = await api.get<unknown>('/activity/stats');
    if (response.success && response.data) {
      response.data = unwrapData<ActivityStats>(response.data, 'stats');
    }
    return response as ApiResponse<ActivityStats>;
  },
};

export default exerciseService;
