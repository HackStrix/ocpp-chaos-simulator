import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { BackendEvent } from '@/lib/api';
import { convertBackendEventToFrontend } from '@/lib/api';
import { useCallback } from 'react';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...eventKeys.lists(), filters] as const,
};

interface UseEventsOptions {
  limit?: number;
  level?: string;
  type?: string;
  autoRefresh?: boolean;
  refetchInterval?: number;
}

// Get events with optional filters
export function useEvents(options: UseEventsOptions = {}) {
  const {
    limit = 50,
    level,
    type,
    autoRefresh = true,
    refetchInterval = 5000
  } = options;

  const filters = { limit, level, type };
  
  return useQuery({
    queryKey: eventKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (limit) params.set('limit', limit.toString());
      if (level) params.set('level', level);
      if (type) params.set('type', type);
      
      const query = params.toString();
      const endpoint = query ? `/events?${query}` : '/events';
      
      return apiClient.get<BackendEvent[]>(endpoint);
    },
    select: (data) => data.map(convertBackendEventToFrontend),
    refetchInterval: autoRefresh ? refetchInterval : false,
    staleTime: 2000,
  });
}

// Get events for a specific charger
export function useChargerEvents(chargerId: number, options: UseEventsOptions = {}) {
  return useEvents({
    ...options,
    type: 'charger', // Filter by charger events
  });
}

// Get events for a specific scenario
export function useScenarioEvents(scenarioName: string, options: UseEventsOptions = {}) {
  return useEvents({
    ...options,
    type: 'simulation', // Filter by simulation events
  });
}

// Hook to manually add events (for optimistic updates)
export function useEventActions() {
  const queryClient = useQueryClient();

  const addEvent = useCallback((event: any) => {
    // Optimistically add event to all event queries
    queryClient.setQueriesData(
      { queryKey: eventKeys.lists() },
      (oldData: any) => {
        if (!oldData) return [event];
        return [event, ...oldData.slice(0, 99)]; // Keep last 100 events
      }
    );
  }, [queryClient]);

  const clearEvents = useCallback(() => {
    queryClient.removeQueries({ queryKey: eventKeys.lists() });
  }, [queryClient]);

  return {
    addEvent,
    clearEvents,
  };
}
