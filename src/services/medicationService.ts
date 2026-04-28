/**
 * Medication Service
 * 
 * Handles medication management and schedule tracking.
 * Unwraps nested backend response keys.
 */

import api, { ApiResponse, unwrapData } from './api';

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  instructions?: string;
  color: string;
  start_date?: string;
  end_date?: string;
  refill_date?: string;
  prescribed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationScheduleItem {
  id: string;
  medication_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  date: string;
  status: 'pending' | 'taken' | 'skipped' | 'missed';
  taken_at?: string;
  notes?: string;
  color: string;
}

export interface MedicationCreateData {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  instructions?: string;
  color?: string;
  start_date?: string;
  end_date?: string;
  refill_date?: string;
  prescribed_by?: string;
}

export interface MedicationUpdateData extends Partial<MedicationCreateData> {}

export interface MedicationStats {
  total_medications: number;
  active_medications: number;
  today_doses: number;
  taken_today: number;
  adherence_rate: number;
  weekly_adherence: number;
  monthly_adherence: number;
  current_streak: number;
  longest_streak: number;
  upcoming_refills: number;
}

export interface ScheduleUpdateData {
  status: 'taken' | 'skipped';
  taken_at?: string;
  notes?: string;
}

export const medicationService = {
  getAll: async (): Promise<ApiResponse<Medication[]>> => {
    const response = await api.get<unknown>('/medications');
    if (response.success && response.data) {
      response.data = unwrapData<Medication[]>(response.data, 'medications');
    }
    return response as ApiResponse<Medication[]>;
  },

  getById: async (id: string | number): Promise<ApiResponse<Medication>> => {
    const response = await api.get<unknown>(`/medications/${id}`);
    if (response.success && response.data) {
      response.data = unwrapData<Medication>(response.data, 'medication');
    }
    return response as ApiResponse<Medication>;
  },

  create: async (data: MedicationCreateData): Promise<ApiResponse<Medication>> => {
    const response = await api.post<unknown>('/medications', data);
    if (response.success && response.data) {
      response.data = unwrapData<Medication>(response.data, 'medication');
    }
    return response as ApiResponse<Medication>;
  },

  update: async (id: string | number, data: MedicationUpdateData): Promise<ApiResponse<Medication>> => {
    const response = await api.put<unknown>(`/medications/${id}`, data);
    if (response.success && response.data) {
      response.data = unwrapData<Medication>(response.data, 'medication');
    }
    return response as ApiResponse<Medication>;
  },

  delete: async (id: string | number): Promise<ApiResponse<void>> => {
    return api.delete<void>(`/medications/${id}`);
  },

  getTodaySchedule: async (): Promise<ApiResponse<MedicationScheduleItem[]>> => {
    const response = await api.get<unknown>('/medications/schedule');
    if (response.success && response.data) {
      response.data = unwrapData<MedicationScheduleItem[]>(response.data, 'schedule');
    }
    return response as ApiResponse<MedicationScheduleItem[]>;
  },

  updateSchedule: async (id: string | number, data: ScheduleUpdateData): Promise<ApiResponse<MedicationScheduleItem>> => {
    return api.put<MedicationScheduleItem>(`/medications/schedule/${id}`, data);
  },

  getStats: async (): Promise<ApiResponse<MedicationStats>> => {
    const response = await api.get<unknown>('/medications/stats');
    if (response.success && response.data) {
      response.data = unwrapData<MedicationStats>(response.data, 'stats');
    }
    return response as ApiResponse<MedicationStats>;
  },
};

export default medicationService;
