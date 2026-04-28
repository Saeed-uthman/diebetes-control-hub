/**
 * Services Index
 * 
 * Central export point for all API services.
 */

export { default as api, tokenManager } from './api';
export type { ApiResponse, AuthTokens } from './api';

export { default as authService } from './authService';
export type { User, UserRole, LoginCredentials, RegisterData, AuthResponse } from './authService';

export { default as userService } from './userService';
export type { UserListParams, UserStats, UserUpdateData } from './userService';

export { default as medicationService } from './medicationService';
export type { 
  Medication, 
  MedicationScheduleItem, 
  MedicationCreateData, 
  MedicationStats 
} from './medicationService';

export { default as glucoseService } from './glucoseService';
export type { 
  GlucoseReading, 
  GlucoseCreateData, 
  GlucoseStats, 
  GlucoseTrend,
  ReadingType 
} from './glucoseService';

export { default as recipeService } from './recipeService';
export type { Recipe, RecipeCreateData, Macros } from './recipeService';

export { default as exerciseService } from './exerciseService';
export type { 
  Exercise, 
  ActivityLog, 
  ActivityCreateData, 
  WeeklySummary, 
  Difficulty 
} from './exerciseService';

export { default as educationService } from './educationService';
export type { 
  EducationContent, 
  EducationCreateData, 
  ContentType, 
  TargetAudience 
} from './educationService';

export { default as notificationService } from './notificationService';
export type { Notification, NotificationPreferences, NotificationType } from './notificationService';

export { default as analyticsService } from './analyticsService';
export type { 
  AnalyticsSummary, 
  UserTrend, 
  ContentEngagement, 
  PlatformActivity 
} from './analyticsService';
