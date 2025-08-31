export interface ChargerConfig {
  identifier: string;
  model: string;
  vendor: string;
  serial_number: string;
  connector_count: number;
  features: string[];
  csms_endpoint: string;
  ocpp_version: string;
  basic_auth_user?: string;
  basic_auth_pass?: string;
  custom_data?: Record<string, string>;
}

export type ChargerStatus = 'offline' | 'connecting' | 'connected' | 'error';

export interface Connector {
  id: number;
  status: ConnectorStatus;
}

export type ConnectorStatus = 
  | 'Available'
  | 'Preparing' 
  | 'Charging'
  | 'SuspendedEVSE'
  | 'SuspendedEV'
  | 'Finishing'
  | 'Reserved'
  | 'Unavailable'
  | 'Faulted';

export interface Transaction {
  id: number;
  connector_id: number;
  id_tag: string;
  start_time: string;
  end_time?: string;
  meter_start: number;
  meter_stop?: number;
  reason?: string;
  status: TransactionStatus;
}

export type TransactionStatus = 'active' | 'completed' | 'failed';

export interface VirtualCharger {
  id: string;
  config: ChargerConfig;
  status: ChargerStatus;
  connectors: Connector[];
  transactions: Transaction[];
  connected: boolean;
  last_heartbeat?: string;
}

export interface Scenario {
  name: string;
  description: string;
  version: string;
  duration: number;
  tags: string[];
  chargers: {
    count: number;
    template: {
      model: string;
      vendor: string;
      connectors: number;
      ocpp_version: string;
      features?: string[];
    };
  };
  csms: {
    endpoint: string;
    protocol: string;
    basic_auth_user?: string;
    basic_auth_pass?: string;
  };
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  at: number;
  action: string;
  targets?: any;
  params?: Record<string, any>;
  flow?: MessageStep[];
  strategy?: string;
}

export interface MessageStep {
  send?: string;
  wait_for?: string;
  delay?: any;
  repeat?: any;
  params?: Record<string, any>;
  expect?: Record<string, any>;
  timeout?: number;
}

export interface Simulation {
  id: number;
  name: string;
  status: SimulationStatus;
  config: string;
  charger_count: number;
  created_at: string;
  updated_at: string;
}

export type SimulationStatus = 'created' | 'running' | 'stopped' | 'completed' | 'error';

export interface OCPPMessage {
  id: number;
  charger_id: number;
  direction: 'incoming' | 'outgoing';
  message_type: string;
  payload: string;
  created_at: string;
}

export interface SystemEvent {
  id: number;
  type: string;
  entity_id?: number;
  data: string;
  level: 'info' | 'warning' | 'error';
  created_at: string;
}
