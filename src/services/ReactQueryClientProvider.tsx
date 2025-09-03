import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

const queryClient = new QueryClient({
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
