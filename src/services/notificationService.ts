/**
 * Notification Service
 * 
 * Handles user notifications and preferences.
 * Unwraps nested backend response keys.
 */

import api, { ApiResponse, unwrapData } from './api';

export type NotificationType = 'medication' | 'glucose' | 'appointment' | 'education' | 'activity' | 'diet' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
  action_url?: string;
  created_at: string;
}

export interface NotificationPreferences {
  medication_reminders: boolean;
  medication_alerts: boolean;
  glucose_reminders: boolean;
  appointment_reminders: boolean;
  education_updates: boolean;
  system_notifications: boolean;
  email_notifications: boolean;
  email_reminders: boolean;
  weekly_reports: boolean;
  push_notifications: boolean;
}

export interface NotificationListParams {
  unread_only?: boolean;
  type?: NotificationType;
  page?: number;
  per_page?: number;
}

export const notificationService = {
  getAll: async (params?: NotificationListParams): Promise<ApiResponse<Notification[]>> => {
    const response = await api.get<unknown>('/notifications', params as Record<string, string | number | boolean>);
    if (response.success && response.data) {
      response.data = unwrapData<Notification[]>(response.data, 'notifications');
    }
    return response as ApiResponse<Notification[]>;
  },

  markAsRead: async (id: string | number): Promise<ApiResponse<void>> => {
    return api.put<void>(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    return api.put<void>('/notifications/read-all');
  },

  delete: async (id: string | number): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/notifications/${id}`);
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.get<unknown>('/notifications/unread-count');
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      // Backend may return { unread_count: N } or { count: N }
      const count = (raw.unread_count ?? raw.count ?? 0) as number;
      response.data = { count } as unknown;
    }
    return response as ApiResponse<{ count: number }>;
  },

  getPreferences: async (): Promise<ApiResponse<NotificationPreferences>> => {
    const response = await api.get<unknown>('/notifications/preferences');
    if (response.success && response.data) {
      response.data = unwrapData<NotificationPreferences>(response.data, 'preferences');
    }
    return response as ApiResponse<NotificationPreferences>;
  },

  updatePreferences: async (data: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> => {
    const response = await api.put<unknown>('/notifications/preferences', data);
    if (response.success && response.data) {
      response.data = unwrapData<NotificationPreferences>(response.data, 'preferences');
    }
    return response as ApiResponse<NotificationPreferences>;
  },

  sendMedicationReminder: async (data: {
    medication_name: string;
    dosage: string;
    scheduled_time: string;
  }): Promise<ApiResponse<void>> => {
    return api.post<void>('/notifications/medication-reminder', data);
  },

  sendGlucoseAlert: async (data: {
    glucose_value: number;
    reading_type: string;
    alert_level: 'low' | 'normal' | 'high';
  }): Promise<ApiResponse<void>> => {
    return api.post<void>('/notifications/glucose-alert', data);
  },
};

export default notificationService;
