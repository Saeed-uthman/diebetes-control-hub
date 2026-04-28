import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, UserRole } from '@/services/authService';
import { tokenManager } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  canAccessMedication: boolean;
  canAccessAdmin: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from API on mount if tokens exist
  useEffect(() => {
    const initializeAuth = async () => {
      if (tokenManager.hasTokens()) {
        try {
          const response = await authService.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token is invalid, clear it
            tokenManager.clearTokens();
          }
        } catch (error) {
          console.error('Failed to fetch current user:', error);
          tokenManager.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.error?.message || 'Invalid email or password' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authService.register({ email, password, name, role });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.error?.message || 'Registration failed' 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'An error occurred during registration' };
    }
  };

  const refreshUser = async () => {
    if (tokenManager.hasTokens()) {
      try {
        const response = await authService.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    canAccessMedication: user?.role === 'admin' || user?.role === 'infected',
    canAccessAdmin: user?.role === 'admin',
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Re-export types for convenience
export type { User, UserRole };
