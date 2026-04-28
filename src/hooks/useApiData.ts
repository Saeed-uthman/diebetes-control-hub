/**
 * Custom hooks for API data fetching with loading, error states,
 * auto-refresh on window focus, and interval-based polling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse } from '@/services/api';

interface UseApiDataOptions {
  /** Polling interval in milliseconds (0 = disabled). Default: 0 */
  pollingInterval?: number;
  /** Refetch when the window regains focus. Default: true */
  refetchOnFocus?: boolean;
  /** Show toast on error. Default: false */
  showErrorToast?: boolean;
}

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic hook for fetching API data with auto-refresh and polling support.
 */
export function useApiData<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  deps: unknown[] = [],
  options: UseApiDataOptions = {}
): UseApiDataResult<T> {
  const { pollingInterval = 0, refetchOnFocus = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFn();
      if (!isMounted.current) return;
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch data');
      }
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [fetchFn]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => { isMounted.current = false; };
  }, [...deps, fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnFocus) return;
    const onFocus = () => { fetchData(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetchOnFocus, fetchData]);

  // Polling
  useEffect(() => {
    if (!pollingInterval || pollingInterval <= 0) return;
    const id = setInterval(fetchData, pollingInterval);
    return () => clearInterval(id);
  }, [pollingInterval, fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for fetching data that depends on authentication,
 * with auto-refresh and polling support.
 */
export function useAuthenticatedData<T>(
  fetchFn: () => Promise<ApiResponse<T>>,
  isAuthenticated: boolean,
  deps: unknown[] = [],
  options: UseApiDataOptions = {}
): UseApiDataResult<T> {
  const { pollingInterval = 0, refetchOnFocus = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFn();
      if (!isMounted.current) return;
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch data');
      }
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [fetchFn, isAuthenticated]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => { isMounted.current = false; };
  }, [...deps, fetchData]);

  useEffect(() => {
    if (!refetchOnFocus || !isAuthenticated) return;
    const onFocus = () => { fetchData(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refetchOnFocus, isAuthenticated, fetchData]);

  useEffect(() => {
    if (!pollingInterval || pollingInterval <= 0 || !isAuthenticated) return;
    const id = setInterval(fetchData, pollingInterval);
    return () => clearInterval(id);
  }, [pollingInterval, isAuthenticated, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
