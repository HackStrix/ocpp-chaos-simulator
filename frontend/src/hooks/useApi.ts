// React hooks for API integration with loading states and error handling

import { useState, useEffect, useCallback } from 'react';
import { 
  api, 
  BackendCharger, 
  BackendScenario, 
  BackendSystemStatus,
  BackendEvent,
  CreateChargerRequest,
  convertBackendChargerToFrontend,
  convertBackendScenarioToFrontend,
  convertBackendEventToFrontend
} from '@/lib/api';
import { VirtualCharger, Scenario } from '@/types/ocpp';
import { RealTimeEvent } from '@/types/events';

// Generic hook for API state management
export function useAsyncState<T>(
  initialState: T,
  asyncFn: () => Promise<T>
) {
  const [data, setData] = useState<T>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  return { data, loading, error, execute, setData };
}

// Hook for chargers data
export function useChargers() {
  const {
    data: backendChargers,
    loading,
    error,
    execute: fetchChargers,
    setData: setBackendChargers
  } = useAsyncState<BackendCharger[]>([], api.getChargers);

  // Convert backend chargers to frontend format
  const chargers: VirtualCharger[] = (backendChargers || []).map(convertBackendChargerToFrontend);

  const createCharger = useCallback(async (chargerData: CreateChargerRequest) => {
    const newCharger = await api.createCharger(chargerData);
    setBackendChargers(prev => [...(prev || []), newCharger]);
    return newCharger;
  }, [setBackendChargers]);

  const deleteCharger = useCallback(async (id: number) => {
    await api.deleteCharger(id);
    setBackendChargers(prev => (prev || []).filter(c => c.id !== id));
  }, [setBackendChargers]);

  return {
    chargers,
    loading,
    error,
    fetchChargers,
    createCharger,
    deleteCharger,
  };
}

// Hook for scenarios data
export function useScenarios() {
  const {
    data: backendScenarios,
    loading,
    error,
    execute: fetchScenarios,
  } = useAsyncState<BackendScenario[]>([], api.getScenarios);

  // Convert backend scenarios to frontend format
  const scenarios: Scenario[] = (backendScenarios || []).map(convertBackendScenarioToFrontend);

  const runScenario = useCallback(async (scenarioName: string) => {
    return await api.runScenario(scenarioName);
  }, []);

  const stopScenario = useCallback(async (scenarioName: string) => {
    return await api.stopScenario(scenarioName);
  }, []);

  return {
    scenarios,
    loading,
    error,
    fetchScenarios,
    runScenario,
    stopScenario,
  };
}

// Hook for system status
export function useSystemStatus() {
  const {
    data: systemStatus,
    loading,
    error,
    execute: fetchSystemStatus,
  } = useAsyncState<BackendSystemStatus | null>(null, api.getSystemStatus);

  // Auto-refresh system status every 10 seconds
  useEffect(() => {
    fetchSystemStatus(); // Initial fetch
    
    const interval = setInterval(() => {
      fetchSystemStatus();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  return {
    systemStatus,
    loading,
    error,
    fetchSystemStatus,
  };
}

// Hook for events data  
export function useEvents(params?: { limit?: number; level?: string; type?: string }) {
  const asyncFn = useCallback(() => api.getEvents(params), [params]);
  
  const {
    data: backendEvents,
    loading,
    error,
    execute: fetchEvents,
    setData: setBackendEvents
  } = useAsyncState<BackendEvent[]>([], asyncFn);

  // Convert backend events to frontend format
  const events: RealTimeEvent[] = (backendEvents || []).map(convertBackendEventToFrontend);

  // Auto-refresh events every 5 seconds
  useEffect(() => {
    fetchEvents(); // Initial fetch
    
    const interval = setInterval(() => {
      fetchEvents();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Add new event (for real-time updates)
  const addEvent = useCallback((event: RealTimeEvent) => {
    // Note: This is for simulated events, real events come from backend
    setBackendEvents(prev => [{
      id: Date.now(),
      type: event.type,
      entity_id: (event.data as any).entity_id || undefined,
      level: 'info',
      data: JSON.stringify(event.data),
      created_at: new Date().toISOString(),
    }, ...(prev || []).slice(0, 99)]); // Keep last 100 events
  }, [setBackendEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    addEvent,
  };
}

// Hook for API health check
export function useHealthCheck() {
  const [isHealthy, setIsHealthy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getHealth();
        setIsHealthy(true);
      } catch {
        setIsHealthy(false);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, loading };
}

// Combined hook for dashboard data
export function useDashboard() {
  const { chargers, loading: chargersLoading, error: chargersError, fetchChargers, createCharger, deleteCharger } = useChargers();
  const { scenarios, loading: scenariosLoading, error: scenariosError, fetchScenarios, runScenario, stopScenario } = useScenarios();
  const { systemStatus, loading: statusLoading, error: statusError } = useSystemStatus();
  const { events, loading: eventsLoading, error: eventsError, addEvent } = useEvents({ limit: 50 });
  const { isHealthy } = useHealthCheck();

  // Initial data fetch
  useEffect(() => {
    fetchChargers();
    fetchScenarios();
  }, [fetchChargers, fetchScenarios]);

  // Enhanced scenario handlers that add events
  const handleRunScenario = useCallback(async (scenario: Scenario) => {
    try {
      const result = await runScenario(scenario.name);
      
      // Add simulation start event
      addEvent({
        type: 'simulation.started',
        data: {
          simulation_id: Date.now(),
          name: scenario.name,
          message: result.message,
        },
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Failed to run scenario:', error);
      throw error;
    }
  }, [runScenario, addEvent]);

  const handleStopScenario = useCallback(async (scenarioName: string) => {
    try {
      const result = await stopScenario(scenarioName);
      
      // Add simulation stop event
      addEvent({
        type: 'simulation.stopped',
        data: {
          simulation_id: Date.now(),
          name: scenarioName,
          message: result.message,
        },
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Failed to stop scenario:', error);
      throw error;
    }
  }, [stopScenario, addEvent]);

  // Calculate stats
  const stats = {
    totalChargers: systemStatus?.total_chargers || chargers.length,
    connectedChargers: systemStatus?.active_chargers || chargers.filter(c => c.connected).length,
    activeTransactions: chargers.reduce((total, charger) => 
      total + (charger.transactions || []).filter(t => t.status === 'active').length, 0
    ),
    totalEvents: events.length,
    runningScenarios: systemStatus?.running_scenarios || 0,
    databaseStatus: systemStatus?.database_status || 'unknown',
  };

  const loading = chargersLoading || scenariosLoading || statusLoading;
  const error = chargersError || scenariosError || statusError || eventsError;

  return {
    // Data
    chargers,
    scenarios,
    events,
    stats,
    systemStatus,
    isConnected: isHealthy,
    
    // Loading states
    loading,
    chargersLoading,
    scenariosLoading,
    eventsLoading,
    
    // Errors
    error,
    chargersError,
    scenariosError,
    eventsError,
    
    // Actions
    handleRunScenario,
    handleStopScenario,
    createCharger,
    deleteCharger,
    fetchChargers,
    fetchScenarios,
  };
}
