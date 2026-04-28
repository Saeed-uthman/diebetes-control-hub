/**
 * Analytics Service (Admin)
 * 
 * Handles platform analytics and dashboard data.
 * Maps nested backend responses to flat frontend interfaces.
 */

import api, { ApiResponse } from './api';

export interface AnalyticsSummary {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  user_growth_percentage: number;
  total_content: number;
  content_engagement_rate: number;
  medication_adherence_rate: number;
  average_glucose_level: number;
}

export interface UserTrend {
  date: string;
  new_users: number;
  active_users: number;
  total_users: number;
}

export interface ContentEngagement {
  content_id: string;
  title: string;
  type: string;
  views: number;
  completions: number;
  average_progress: number;
  engagement_rate: number;
}

export interface PlatformActivity {
  date: string;
  logins: number;
  content_views: number;
  medication_logs: number;
  glucose_readings: number;
  activity_logs: number;
}

export interface MedicationMetrics {
  total_medications: number;
  active_users: number;
  adherence_rate: number;
  doses_taken: number;
  doses_missed: number;
  common_medications: { name: string; count: number }[];
}

export interface GlucoseMetrics {
  total_readings: number;
  active_users: number;
  average_level: number;
  in_range_percentage: number;
  trend: 'improving' | 'stable' | 'worsening';
  distribution: {
    low: number;
    normal: number;
    high: number;
    very_high: number;
  };
}

export interface AnalyticsParams {
  start_date?: string;
  end_date?: string;
  period?: 'day' | 'week' | 'month';
}

export const analyticsService = {
  /**
   * Get analytics summary for dashboard.
   * Backend returns { users: {...}, content: {...}, activity: {...} }.
   * We flatten it into AnalyticsSummary.
   */
  getSummary: async (): Promise<ApiResponse<AnalyticsSummary>> => {
    const response = await api.get<unknown>('/analytics/summary');
    if (response.success && response.data) {
      const raw = response.data as Record<string, Record<string, unknown>>;
      const users = raw.users || {};
      const content = raw.content || {};
      const activity = raw.activity || {};
      response.data = {
        total_users: (users.total ?? users.total_users ?? 0) as number,
        active_users: (users.active ?? users.active_users ?? 0) as number,
        new_users_this_month: (users.new_this_month ?? users.new_users_this_month ?? 0) as number,
        user_growth_percentage: (users.growth_percentage ?? users.user_growth_percentage ?? 0) as number,
        total_content: (content.total ?? content.total_content ?? 0) as number,
        content_engagement_rate: (content.engagement_rate ?? content.content_engagement_rate ?? 0) as number,
        medication_adherence_rate: (activity.medication_adherence ?? activity.medication_adherence_rate ?? 0) as number,
        average_glucose_level: (activity.average_glucose ?? activity.average_glucose_level ?? 0) as number,
      } as unknown;
    }
    return response as ApiResponse<AnalyticsSummary>;
  },

  getUserTrends: async (params?: AnalyticsParams): Promise<ApiResponse<UserTrend[]>> => {
    const response = await api.get<unknown>('/analytics/users', params as Record<string, string | number | boolean>);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      response.data = (raw.trends ?? response.data) as unknown;
    }
    return response as ApiResponse<UserTrend[]>;
  },

  getContentEngagement: async (params?: AnalyticsParams): Promise<ApiResponse<ContentEngagement[]>> => {
    const response = await api.get<unknown>('/analytics/content', params as Record<string, string | number | boolean>);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      response.data = (raw.top_viewed ?? raw.content ?? response.data) as unknown;
    }
    return response as ApiResponse<ContentEngagement[]>;
  },

  getPlatformActivity: async (params?: AnalyticsParams): Promise<ApiResponse<PlatformActivity[]>> => {
    const response = await api.get<unknown>('/analytics/activity', params as Record<string, string | number | boolean>);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      response.data = (raw.daily_activity ?? raw.activity ?? response.data) as unknown;
    }
    return response as ApiResponse<PlatformActivity[]>;
  },

  getMedicationMetrics: async (): Promise<ApiResponse<MedicationMetrics>> => {
    const response = await api.get<unknown>('/analytics/medication');
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      const overall = (raw.overall_adherence ?? raw) as Record<string, unknown>;
      response.data = {
        total_medications: (overall.total_medications ?? 0) as number,
        active_users: (overall.active_users ?? 0) as number,
        adherence_rate: (overall.adherence_rate ?? 0) as number,
        doses_taken: (overall.doses_taken ?? overall.taken ?? 0) as number,
        doses_missed: (overall.doses_missed ?? overall.missed ?? 0) as number,
        common_medications: (raw.common_medications ?? []) as { name: string; count: number }[],
      } as unknown;
    }
    return response as ApiResponse<MedicationMetrics>;
  },

  getGlucoseMetrics: async (): Promise<ApiResponse<GlucoseMetrics>> => {
    const response = await api.get<unknown>('/analytics/glucose');
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      const overall = (raw.overall ?? raw) as Record<string, unknown>;
      const dist = (raw.distribution ?? {}) as Record<string, number>;
      response.data = {
        total_readings: (overall.total_readings ?? 0) as number,
        active_users: (overall.active_users ?? 0) as number,
        average_level: (overall.average ?? overall.average_level ?? 0) as number,
        in_range_percentage: (overall.in_range_percentage ?? 0) as number,
        trend: (overall.trend ?? 'stable') as 'improving' | 'stable' | 'worsening',
        distribution: {
          low: dist.low ?? 0,
          normal: dist.normal ?? 0,
          high: dist.high ?? 0,
          very_high: dist.very_high ?? 0,
        },
      } as unknown;
    }
    return response as ApiResponse<GlucoseMetrics>;
  },
};

export default analyticsService;
