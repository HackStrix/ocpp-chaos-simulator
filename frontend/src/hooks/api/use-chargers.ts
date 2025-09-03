import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { BackendCharger, CreateChargerRequest } from '@/lib/api';
import { convertBackendChargerToFrontend } from '@/lib/api';

// Query keys
export const chargerKeys = {
  all: ['chargers'] as const,
  lists: () => [...chargerKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...chargerKeys.lists(), filters] as const,
  details: () => [...chargerKeys.all, 'detail'] as const,
  detail: (id: number) => [...chargerKeys.details(), id] as const,
};

// Get all chargers
export function useChargers() {
  return useQuery({
    queryKey: chargerKeys.lists(),
    queryFn: () => apiClient.get<BackendCharger[]>('/chargers'),
    select: (data) => data.map(convertBackendChargerToFrontend),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    staleTime: 5000,
  });
}

// Get single charger
export function useCharger(id: number) {
  return useQuery({
    queryKey: chargerKeys.detail(id),
    queryFn: () => apiClient.get<BackendCharger>(`/chargers/${id}`),
    select: (data) => convertBackendChargerToFrontend(data),
    enabled: !!id,
  });
}

// Create charger mutation
export function useCreateCharger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChargerRequest) =>
      apiClient.post<BackendCharger>('/chargers', data),
    onSuccess: () => {
      // Invalidate and refetch charger list
      queryClient.invalidateQueries({ queryKey: chargerKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to create charger:', error);
    },
  });
}

// Delete charger mutation
export function useDeleteCharger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/chargers/${id}`),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: chargerKeys.detail(deletedId) });
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: chargerKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete charger:', error);
    },
  });
}

// Update charger mutation (if needed in the future)
export function useUpdateCharger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateChargerRequest> }) =>
      apiClient.put<BackendCharger>(`/chargers/${id}`, data),
    onSuccess: (data, variables) => {
      // Update the charger in cache
      queryClient.setQueryData(chargerKeys.detail(variables.id), data);
      // Invalidate list to ensure consistency
      queryClient.invalidateQueries({ queryKey: chargerKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update charger:', error);
    },
  });
}
