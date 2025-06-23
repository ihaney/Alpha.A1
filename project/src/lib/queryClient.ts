import { QueryClient } from '@tanstack/react-query';
import { logError } from './errorLogging';
import { createPersistentCache } from './cache';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        logError(error instanceof Error ? error : new Error(String(error)), {
          source: 'react-query'
        });
      }
    }
  }
});

// Initialize persistent cache
createPersistentCache(queryClient);