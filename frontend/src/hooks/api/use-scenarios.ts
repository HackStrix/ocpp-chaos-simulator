import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { BackendScenario } from '@/lib/api';
import { convertBackendScenarioToFrontend } from '@/lib/api';

// Query keys
export const scenarioKeys = {
  all: ['scenarios'] as const,
  lists: () => [...scenarioKeys.all, 'list'] as const,
  details: () => [...scenarioKeys.all, 'detail'] as const,
  detail: (name: string) => [...scenarioKeys.details(), name] as const,
};

// Get all scenarios
export function useScenarios() {
  return useQuery({
    queryKey: scenarioKeys.lists(),
    queryFn: () => apiClient.get<BackendScenario[]>('/scenarios'),
    select: (data) => data.map(convertBackendScenarioToFrontend),
    staleTime: 30000, // Scenarios don't change often
  });
}

// Get single scenario
export function useScenario(name: string) {
  return useQuery({
    queryKey: scenarioKeys.detail(name),
    queryFn: () => apiClient.get<BackendScenario>(`/scenarios/${encodeURIComponent(name)}`),
    select: (data) => convertBackendScenarioToFrontend(data),
    enabled: !!name,
  });
}

// Run scenario mutation
export function useRunScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scenarioName: string) =>
      apiClient.post<{ scenario: string; status: string; message: string }>(
        `/scenarios/${encodeURIComponent(scenarioName)}/run`
      ),
    onSuccess: () => {
      // Invalidate system status to show running scenarios
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
      // Invalidate chargers as new ones might be created
      queryClient.invalidateQueries({ queryKey: ['chargers'] });
    },
    onError: (error) => {
      console.error('Failed to run scenario:', error);
    },
  });
}

// Stop scenario mutation
export function useStopScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scenarioName: string) =>
      apiClient.post<{ scenario: string; status: string; message: string }>(
        `/scenarios/${encodeURIComponent(scenarioName)}/stop`
      ),
    onSuccess: () => {
      // Invalidate system status
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
      // Invalidate chargers as they might be affected
      queryClient.invalidateQueries({ queryKey: ['chargers'] });
    },
    onError: (error) => {
      console.error('Failed to stop scenario:', error);
    },
  });
}
