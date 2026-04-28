/**
 * Authentication Service
 * 
 * Handles login, registration, logout, and user session management.
 * Adapted to match PHP backend response format.
 */

import api, { tokenManager, ApiResponse } from './api';

export type UserRole = 'admin' | 'infected' | 'non-infected';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  verified: boolean;
  createdAt: string;
  lastLogin: string;
  settings?: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

// Backend returns user + tokens flat in data
interface BackendAuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Backend /auth/me returns nested user + settings
interface BackendMeResponse {
  user: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface PasswordUpdateData {
  current_password: string;
  new_password: string;
}

export interface SettingsUpdateData {
  notifications?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

/**
 * Map backend user object (snake_case) to frontend User (camelCase)
 */
function mapUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw.id ?? ''),
    email: String(raw.email ?? ''),
    name: String(raw.name ?? ''),
    role: (raw.role as UserRole) ?? 'non-infected',
    avatar: raw.avatar as string | undefined,
    verified: Boolean(raw.verified ?? raw.email_verified ?? false),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    lastLogin: String(raw.last_login ?? raw.lastLogin ?? ''),
    settings: raw.settings as User['settings'] | undefined,
  };
}

export const authService = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<BackendAuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      const { user, access_token, refresh_token, expires_in } = response.data;
      tokenManager.setTokens({ access_token, refresh_token, expires_in });
      return {
        ...response,
        data: {
          user: mapUser(user as unknown as Record<string, unknown>),
          tokens: { access_token, refresh_token, expires_in },
        },
      };
    }
    
    return response as unknown as ApiResponse<AuthResponse>;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<BackendAuthResponse>('/auth/register', data);
    
    if (response.success && response.data) {
      const { user, access_token, refresh_token, expires_in } = response.data;
      tokenManager.setTokens({ access_token, refresh_token, expires_in });
      return {
        ...response,
        data: {
          user: mapUser(user as unknown as Record<string, unknown>),
          tokens: { access_token, refresh_token, expires_in },
        },
      };
    }
    
    return response as unknown as ApiResponse<AuthResponse>;
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      tokenManager.clearTokens();
    }
  },

  /**
   * Get the current authenticated user
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<BackendMeResponse>('/auth/me');
    
    if (response.success && response.data) {
      const raw = response.data;
      const userObj = (raw.user ?? raw) as Record<string, unknown>;
      const user = mapUser(userObj);
      // Merge settings from separate key if present
      if (raw.settings && typeof raw.settings === 'object') {
        user.settings = raw.settings as User['settings'];
      }
      return { ...response, data: user };
    }
    
    return response as unknown as ApiResponse<User>;
  },

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated: (): boolean => {
    return tokenManager.hasTokens();
  },

  /**
   * Refresh the access token
   */
  refreshToken: async (): Promise<ApiResponse<{ access_token: string }>> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      return {
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token available',
        },
      };
    }

    const response = await api.post<{ access_token: string; expires_in: number }>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    if (response.success && response.data) {
      tokenManager.setTokens({ access_token: response.data.access_token });
    }

    return response;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: ProfileUpdateData): Promise<ApiResponse<User>> => {
    const response = await api.put<{ user: Record<string, unknown> }>('/auth/profile', data);
    if (response.success && response.data?.user) {
      return { ...response, data: mapUser(response.data.user) };
    }
    return response as unknown as ApiResponse<User>;
  },

  /**
   * Update user password
   */
  updatePassword: async (data: PasswordUpdateData): Promise<ApiResponse<void>> => {
    return api.put<void>('/auth/password', data);
  },

  /**
   * Update user settings
   */
  updateSettings: async (data: SettingsUpdateData): Promise<ApiResponse<User>> => {
    const response = await api.put<{ user: Record<string, unknown> }>('/auth/settings', data);
    if (response.success && response.data?.user) {
      return { ...response, data: mapUser(response.data.user) };
    }
    return response as unknown as ApiResponse<User>;
  },

  /**
   * Request a password reset email
   */
  forgotPassword: async (email: string): Promise<ApiResponse<{ token?: string }>> => {
    return api.post<{ token?: string }>('/auth/forgot-password', { email });
  },

  /**
   * Reset password using a token
   */
  resetPassword: async (token: string, password: string): Promise<ApiResponse<void>> => {
    return api.post<void>('/auth/reset-password', { token, password });
  },

  /**
   * Verify email address using token
   */
  verifyEmail: async (token: string): Promise<ApiResponse<void>> => {
    return api.post<void>('/auth/verify-email', { token });
  },

  /**
   * Resend email verification
   */
  resendVerification: async (): Promise<ApiResponse<void>> => {
    return api.post<void>('/auth/resend-verification');
  },
};

export default authService;
