/**
 * Hook for API mutations (create, update, delete) with automatic toast notifications.
 */

import { useState, useCallback } from 'react';
import { ApiResponse } from '@/services/api';
import { toast } from 'sonner';

interface UseApiActionOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UseApiActionResult<TArgs extends unknown[], TData> {
  execute: (...args: TArgs) => Promise<ApiResponse<TData>>;
  loading: boolean;
}

/**
 * Generic hook for performing API mutations with toast feedback.
 */
export function useApiAction<TArgs extends unknown[], TData = unknown>(
  actionFn: (...args: TArgs) => Promise<ApiResponse<TData>>,
  options: UseApiActionOptions = {}
): UseApiActionResult<TArgs, TData> {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (...args: TArgs): Promise<ApiResponse<TData>> => {
      setLoading(true);
      try {
        const response = await actionFn(...args);
        if (response.success) {
          if (options.successMessage) {
            toast.success(options.successMessage);
          }
          options.onSuccess?.();
        } else {
          const errMsg = response.error?.message || options.errorMessage || 'Operation failed';
          toast.error(errMsg);
          options.onError?.(errMsg);
        }
        return response;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : options.errorMessage || 'An unexpected error occurred';
        toast.error(errMsg);
        options.onError?.(errMsg);
        return {
          success: false,
          error: { code: 'CLIENT_ERROR', message: errMsg },
        };
      } finally {
        setLoading(false);
      }
    },
    [actionFn, options.successMessage, options.errorMessage, options.onSuccess, options.onError]
  );

  return { execute, loading };
}
