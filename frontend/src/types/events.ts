export interface EventBase {
  type: string;
  data: any;
  timestamp: number;
}

export interface ChargerEvent extends EventBase {
  type: 
    | 'charger.boot_notification.sent'
    | 'charger.transaction.started'
    | 'charger.transaction.stopped'  
    | 'charger.stopped'
    | 'charger.status.changed';
  data: {
    charger_id: string;
    [key: string]: any;
  };
}

export interface SimulationEvent extends EventBase {
  type: 
    | 'simulation.started'
    | 'simulation.stopped'
    | 'simulation.completed'
    | 'simulation.error';
  data: {
    simulation_id: number;
    name: string;
    [key: string]: any;
  };
}

export interface OCPPMessageEvent extends EventBase {
  type: 
    | 'ocpp.message.received'
    | 'ocpp.message.sent';
  data: {
    charger_id: string;
    message_type: string;
    message_id: string;
    direction: 'incoming' | 'outgoing';
    payload?: any;
  };
}

export interface ChaosEvent extends EventBase {
  type: 
    | 'chaos.injected'
    | 'chaos.recovered';
  data: {
    strategy_name: string;
    target: string;
    description: string;
  };
}

export type RealTimeEvent = ChargerEvent | SimulationEvent | OCPPMessageEvent | ChaosEvent;

// WebSocket message format from backend
export interface WebSocketMessage {
  event: RealTimeEvent;
}

// Event filtering and display types
export type EventLevel = 'info' | 'warning' | 'error' | 'debug';

export interface EventFilter {
  types: string[];
  chargers: string[];
  levels: EventLevel[];
  search?: string;
}
