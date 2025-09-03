import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

// Query keys
export const healthKeys = {
  all: ['health'] as const,
  status: () => [...healthKeys.all, 'status'] as const,
};

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
}

// Health check hook with auto-refresh
export function useHealthCheck() {
  const query = useQuery({
    queryKey: healthKeys.status(),
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000,
    retry: 1, // Only retry once for health checks
    retryDelay: 1000,
  });

  return {
    ...query,
    isHealthy: query.data?.status === 'ok' && !query.error,
    isUnhealthy: query.error || query.data?.status !== 'ok',
  };
}
