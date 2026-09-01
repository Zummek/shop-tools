import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactNode } from 'react';

import { isDev } from '../utils/envs';

import { isTransientErrorNotifySuppressed } from './queryMeta';
import {
  isTransientQueryError,
  notifyTransientQueryError,
  queryRetryDelay,
  shouldRetryQuery,
} from './queryRetry';
import { captureError } from './sentry';
import { shouldCaptureQueryError } from './shouldCaptureQueryError';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (
        isTransientQueryError(error) &&
        !isTransientErrorNotifySuppressed(query.meta)
      )
        notifyTransientQueryError();
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
