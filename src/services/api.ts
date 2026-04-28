/**
 * Base API Client
 * 
 * Handles all HTTP requests to the PHP backend with JWT token management.
 */

// API Base URL - configure based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Token storage keys
const ACCESS_TOKEN_KEY = 'diabetes_app_token';
const REFRESH_TOKEN_KEY = 'diabetes_app_refresh_token';

// Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    page?: number;
    per_page?: number;
    total?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (tokens: { access_token: string; refresh_token?: string; expires_in?: number }): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
  },

  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  hasTokens: (): boolean => {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  },
};

/**
 * Unwrap nested data from backend responses.
 * Backend often wraps data in named keys like { medications: [...] } or { stats: {...} }.
 * This extracts the value by a specific key, or auto-unwraps single-key objects.
 */
export function unwrapData<T>(data: unknown, key?: string): T {
  if (data === null || data === undefined) return data as T;
  if (key && typeof data === 'object' && data !== null && key in data) {
    return (data as Record<string, unknown>)[key] as T;
  }
  // If data is an array, return as-is (paginated responses)
  if (Array.isArray(data)) return data as T;
  // Auto-unwrap single-key objects (but not if it looks like a real data object with known fields)
  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    if (keys.length === 1 && (Array.isArray((data as Record<string, unknown>)[keys[0]]) || typeof (data as Record<string, unknown>)[keys[0]] === 'object')) {
      return (data as Record<string, unknown>)[keys[0]] as T;
    }
  }
  return data as T;
}

// Refresh token logic
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const result: ApiResponse<{ access_token: string; expires_in: number }> = await response.json();

    if (result.success && result.data) {
      // Backend only returns new access_token, keep existing refresh_token
      tokenManager.setTokens({
        access_token: result.data.access_token,
      });
      return result.data.access_token;
    }

    tokenManager.clearTokens();
    return null;
  } catch (error) {
    tokenManager.clearTokens();
    return null;
  }
};

// Main API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const accessToken = tokenManager.getAccessToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && accessToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        if (newToken) {
          onTokenRefreshed(newToken);
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          window.location.href = '/login';
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Session expired. Please log in again.',
            },
          };
        }
      } else {
        return new Promise((resolve) => {
          subscribeTokenRefresh(async (token) => {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
            });
            resolve(retryResponse.json());
          });
        });
      }
    }

    const result: ApiResponse<T> = await response.json();
    return result;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection.',
      },
    };
  }
}

// HTTP method wrappers
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | boolean>) => {
    const queryString = params
      ? '?' + new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, String(v)])
        ).toString()
      : '';
    return apiRequest<T>(`${endpoint}${queryString}`, { method: 'GET' });
  },

  post: <T>(endpoint: string, data?: unknown) => {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T>(endpoint: string, data?: unknown) => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T>(endpoint: string) => {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
  },
};

export default api;
