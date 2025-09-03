// API client for OCPP Chaos Simulator backend
// Matches the Go backend API structure

export interface APIResponse<T> {
  data?: T;
  message?: string;
}

export interface APIError {
  error: string;
  message?: string;
  code: number;
}

// Backend response types (match Go structs)
export interface BackendCharger {
  id: number;
  identifier: string;
  status: string;
  model?: string;
  vendor?: string;
  serial_number?: string;
  connector_count: number;
  last_seen?: string;
  config?: any;
  created_at: string;
  updated_at: string;
}

export interface BackendScenario {
  name: string;
  description?: string;
  version?: string;
  duration: number;
  tags?: string[];
  charger_count: number;
  csms_endpoint: string;
  status?: string;
}

export interface BackendSystemStatus {
  status: string;
  uptime: string;
  total_chargers: number;
  active_chargers: number;
  running_scenarios: number;
  total_messages: number;
  database_status: string;
  timestamp: string;
}

export interface BackendEvent {
  id: number;
  type: string;
  entity_id?: number;
  level: string;
  data?: string;
  created_at: string;
}

export interface CreateChargerRequest {
  identifier: string;
  model?: string;
  vendor?: string;
  serial_number?: string;
  connector_count?: number;
  csms_endpoint?: string;
  ocpp_version?: string;
  basic_auth_user?: string;
  basic_auth_pass?: string;
  custom_data?: Record<string, string>;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    // Bind methods to ensure proper 'this' context
    this.request = this.request.bind(this);
    this.getHealth = this.getHealth.bind(this);
    this.getChargers = this.getChargers.bind(this);
    this.getCharger = this.getCharger.bind(this);
    this.createCharger = this.createCharger.bind(this);
    this.deleteCharger = this.deleteCharger.bind(this);
    this.getScenarios = this.getScenarios.bind(this);
    this.getScenario = this.getScenario.bind(this);
    this.runScenario = this.runScenario.bind(this);
    this.stopScenario = this.stopScenario.bind(this);
    this.getSystemStatus = this.getSystemStatus.bind(this);
    this.getEvents = this.getEvents.bind(this);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: APIError = await response.json().catch(() => ({
          error: 'Network error',
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status,
        }));
        throw new Error(errorData.message || errorData.error);
      }

      const data: APIResponse<T> = await response.json();
      return data.data as T;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Health check
  async getHealth(): Promise<{ status: string; timestamp: string; service: string }> {
    const response = await fetch('/health');
    return response.json();
  }

  // Charger management
  async getChargers(): Promise<BackendCharger[]> {
    return this.request<BackendCharger[]>('/chargers');
  }

  async getCharger(id: number): Promise<BackendCharger> {
    return this.request<BackendCharger>(`/chargers/${id}`);
  }

  async createCharger(charger: CreateChargerRequest): Promise<BackendCharger> {
    return this.request<BackendCharger>('/chargers', {
      method: 'POST',
      body: JSON.stringify(charger),
    });
  }

  async deleteCharger(id: number): Promise<void> {
    return this.request<void>(`/chargers/${id}`, {
      method: 'DELETE',
    });
  }

  // Scenario management
  async getScenarios(): Promise<BackendScenario[]> {
    return this.request<BackendScenario[]>('/scenarios');
  }

  async getScenario(name: string): Promise<BackendScenario> {
    return this.request<BackendScenario>(`/scenarios/${encodeURIComponent(name)}`);
  }

  async runScenario(name: string): Promise<{ scenario: string; status: string; message: string }> {
    return this.request<{ scenario: string; status: string; message: string }>(
      `/scenarios/${encodeURIComponent(name)}/run`,
      { method: 'POST' }
    );
  }

  async stopScenario(name: string): Promise<{ scenario: string; status: string; message: string }> {
    return this.request<{ scenario: string; status: string; message: string }>(
      `/scenarios/${encodeURIComponent(name)}/stop`,
      { method: 'POST' }
    );
  }

  // System status
  async getSystemStatus(): Promise<BackendSystemStatus> {
    return this.request<BackendSystemStatus>('/status');
  }

  // Events
  async getEvents(params?: {
    limit?: number;
    level?: string;
    type?: string;
  }): Promise<BackendEvent[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.level) searchParams.set('level', params.level);
    if (params?.type) searchParams.set('type', params.type);
    
    const query = searchParams.toString();
    const endpoint = query ? `/events?${query}` : '/events';
    
    return this.request<BackendEvent[]>(endpoint);
  }
}

// Export singleton instance
export const api = new APIClient();

// Utility functions to convert backend data to frontend types
export function convertBackendChargerToFrontend(backendCharger: BackendCharger): import('@/types/ocpp').VirtualCharger {
  return {
    id: backendCharger.identifier,
    config: {
      identifier: backendCharger.identifier,
      model: backendCharger.model || 'Unknown',
      vendor: backendCharger.vendor || 'Unknown', 
      serial_number: backendCharger.serial_number || '',
      connector_count: backendCharger.connector_count || 1,
      features: ['Core'],
      csms_endpoint: 'ws://localhost:8080/ocpp',
      ocpp_version: '1.6',
    },
    status: mapBackendStatusToFrontend(backendCharger.status),
    connectors: Array.from({ length: backendCharger.connector_count || 1 }, (_, i) => ({
      id: i + 1,
      status: 'Available' as const,
    })),
    transactions: [],
    connected: backendCharger.status === 'connected',
    last_heartbeat: backendCharger.last_seen,
  };
}

export function convertBackendScenarioToFrontend(backendScenario: BackendScenario): import('@/types/ocpp').Scenario {
  return {
    name: backendScenario.name,
    description: backendScenario.description || '',
    version: backendScenario.version || '1.0',
    duration: backendScenario.duration,
    tags: backendScenario.tags || [],
    chargers: {
      count: backendScenario.charger_count,
      template: {
        model: 'DefaultCharger',
        vendor: 'DefaultVendor',
        connectors: 1,
        ocpp_version: '1.6',
      },
    },
    csms: {
      endpoint: backendScenario.csms_endpoint,
      protocol: 'ocpp1.6',
    },
    timeline: [],
  };
}

function mapBackendStatusToFrontend(status: string): import('@/types/ocpp').ChargerStatus {
  switch (status.toLowerCase()) {
    case 'connected':
      return 'connected';
    case 'connecting':
      return 'connecting';
    case 'error':
      return 'error';
    default:
      return 'offline';
  }
}

export function convertBackendEventToFrontend(backendEvent: BackendEvent): import('@/types/events').RealTimeEvent {
  let parsedData: any = {};
  try {
    parsedData = backendEvent.data ? JSON.parse(backendEvent.data) : {};
  } catch {
    parsedData = { raw: backendEvent.data };
  }

  return {
    type: backendEvent.type,
    data: {
      ...parsedData,
      entity_id: backendEvent.entity_id,
      level: backendEvent.level,
    },
    timestamp: new Date(backendEvent.created_at).getTime(),
  };
}
