import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { AxiosError, isAxiosError } from 'axios';
import { ReactNode } from 'react';

import { captureError } from './sentry';

const shouldCaptureQueryError = (error: unknown) => {
  if (!isAxiosError(error)) return true;

  if (
    error.code === AxiosError.ECONNABORTED ||
    error.code === AxiosError.ERR_CANCELED
  )
    return false;

  const status = error.response?.status;
  if (status === 400 || status === 401) return false;

  return true;
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (shouldCaptureQueryError(error)) captureError(error);
      console.error('React Query error:', error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (shouldCaptureQueryError(error)) captureError(error);
      console.error('React Query mutation error:', error);
    },
  }),
  defaultOptions: {
    queries: {
      retry: 3,
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
