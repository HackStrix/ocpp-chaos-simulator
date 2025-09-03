import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { BackendSystemStatus } from '@/lib/api';

// Query keys
export const systemStatusKeys = {
  all: ['system-status'] as const,
  current: () => [...systemStatusKeys.all, 'current'] as const,
};

// Get system status with auto-refresh
export function useSystemStatus() {
  return useQuery({
    queryKey: systemStatusKeys.current(),
    queryFn: () => apiClient.get<BackendSystemStatus>('/status'),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    staleTime: 5000,
    retry: (failureCount, error) => {
      // Don't retry if it's a client error (4xx)
      if (error instanceof Error && error.message.includes('4')) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
