import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { AxiosError, isAxiosError } from 'axios';
import { ReactNode } from 'react';

import { isDev } from '../utils/envs';

import { captureError } from './sentry';

const IGNORED_HTTP_STATUSES = new Set([400, 401, 403, 404, 422]);
const TRANSIENT_HTTP_STATUSES = new Set([502, 503, 504]);
const QUERY_RETRY_COUNT = 3;
const TRANSIENT_QUERY_ERROR_MESSAGE = 'Błąd połączenia, spróbuj ponownie';

export const queryRetryDelay = (attemptIndex: number) =>
  Math.min(1000 * 2 ** attemptIndex, 30000);

export const isTransientQueryError = (error: unknown) => {
  if (!isAxiosError(error)) return false;

  if (
    error.code === AxiosError.ECONNABORTED ||
    error.code === AxiosError.ERR_CANCELED
  )
    return false;

  const status = error.response?.status;
  if (status === undefined) return true;

  return TRANSIENT_HTTP_STATUSES.has(status);
};

const shouldRetryQuery = (failureCount: number, error: unknown) => {
  if (failureCount >= QUERY_RETRY_COUNT) return false;
  return isTransientQueryError(error);
};

let notifyQueryError: ((message: string) => void) | null = null;

export const setQueryErrorNotify = (
  notify: ((message: string) => void) | null,
) => {
  notifyQueryError = notify;
};

const shouldCaptureQueryError = (error: unknown) => {
  if (!isAxiosError(error)) return true;

  if (
    error.code === AxiosError.ECONNABORTED ||
    error.code === AxiosError.ERR_CANCELED
  )
    return false;

  const status = error.response?.status;
  if (status !== undefined && IGNORED_HTTP_STATUSES.has(status)) return false;

  return true;
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isTransientQueryError(error)) {
        notifyQueryError?.(TRANSIENT_QUERY_ERROR_MESSAGE);
      }
      if (shouldCaptureQueryError(error)) captureError(error);
      if (isDev) console.error('React Query error:', error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (shouldCaptureQueryError(error)) captureError(error);
      if (isDev) console.error('React Query mutation error:', error);
    },
  }),
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      retryDelay: queryRetryDelay,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
      staleTime: 1 * 60 * 1000, // 1 minute default stale time
      gcTime: 5 * 60 * 1000, // 5 minutes default garbage collection time
    },
  },
});

interface ReactQueryClientProviderProps {
  children: ReactNode;
}

export const ReactQueryClientProvider = ({
  children,
}: ReactQueryClientProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
