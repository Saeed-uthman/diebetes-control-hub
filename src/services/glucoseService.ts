/**
 * Glucose Reading Service
 * 
 * Handles blood glucose logging and statistics.
 * Unwraps nested backend response keys.
 */

import api, { ApiResponse, unwrapData } from './api';

export type ReadingType = 'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'random';

export interface GlucoseReading {
  id: string;
  user_id: string;
  value: number;
  reading_type: ReadingType;
  timestamp: string;
  notes?: string;
  created_at: string;
}

export interface GlucoseCreateData {
  value: number;
  reading_type: ReadingType;
  timestamp?: string;
  notes?: string;
}

export interface GlucoseStats {
  average: number;
  min: number;
  max: number;
  in_range_percentage: number;
  total_readings: number;
  readings_this_week: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface GlucoseTrend {
  date: string;
  average: number;
  min: number;
  max: number;
  count: number;
}

export interface GlucoseListParams {
  start_date?: string;
  end_date?: string;
  reading_type?: ReadingType;
  page?: number;
  per_page?: number;
}

export const glucoseService = {
  getAll: async (params?: GlucoseListParams): Promise<ApiResponse<GlucoseReading[]>> => {
    return api.get<GlucoseReading[]>('/glucose', params as Record<string, string | number | boolean>);
  },

  create: async (data: GlucoseCreateData): Promise<ApiResponse<GlucoseReading>> => {
    const response = await api.post<unknown>('/glucose', data);
    if (response.success && response.data) {
      response.data = unwrapData<GlucoseReading>(response.data, 'reading');

      // Auto-trigger glucose alert email for abnormal readings
      const value = data.value;
      if (value < 70 || value > 180) {
        const alertLevel = value < 70 ? 'low' : 'high';
        try {
          const { notificationService } = await import('./notificationService');
          await notificationService.sendGlucoseAlert({
            glucose_value: value,
            reading_type: data.reading_type,
            alert_level: alertLevel,
          });
        } catch (e) {
          console.warn('Failed to send glucose alert email:', e);
        }
      }
    }
    return response as ApiResponse<GlucoseReading>;
  },

  delete: async (id: string | number): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/glucose/${id}`);
  },

  getStats: async (): Promise<ApiResponse<GlucoseStats>> => {
    const response = await api.get<unknown>('/glucose/stats');
    if (response.success && response.data) {
      response.data = unwrapData<GlucoseStats>(response.data, 'stats');
    }
    return response as ApiResponse<GlucoseStats>;
  },

  getTrends: async (days?: number): Promise<ApiResponse<GlucoseTrend[]>> => {
    const response = await api.get<unknown>('/glucose/trends', { days: days || 30 });
    if (response.success && response.data) {
      response.data = unwrapData<GlucoseTrend[]>(response.data, 'trends');
    }
    return response as ApiResponse<GlucoseTrend[]>;
  },

  getToday: async (): Promise<ApiResponse<GlucoseReading[]>> => {
    const response = await api.get<unknown>('/glucose/today');
    if (response.success && response.data) {
      response.data = unwrapData<GlucoseReading[]>(response.data, 'readings');
    }
    return response as ApiResponse<GlucoseReading[]>;
  },
};

export default glucoseService;
