import { QueryClient } from '@tanstack/react-query';

// Create a client with sensible defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache feature flags for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep feature flags in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Don't refetch on window focus for feature flags
      refetchOnWindowFocus: false
    }
  }
});
