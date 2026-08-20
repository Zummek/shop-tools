import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { AxiosError, isAxiosError } from 'axios';
import { ReactNode } from 'react';

import { isDev } from '../utils/envs';

import {
  isTransientQueryError,
  notifyTransientQueryError,
  queryRetryDelay,
  shouldRetryQuery,
} from './queryRetry';
import { captureError } from './sentry';

const IGNORED_HTTP_STATUSES = new Set([400, 401, 403, 404, 422]);

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
      if (isTransientQueryError(error)) notifyTransientQueryError();
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
