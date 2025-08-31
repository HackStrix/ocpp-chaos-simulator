import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ChargerStatus, ConnectorStatus, TransactionStatus, SimulationStatus } from "@/types/ocpp"
import { EventLevel } from "@/types/events"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function getChargerStatusColor(status: ChargerStatus): string {
  switch (status) {
    case 'connected':
      return 'bg-success-100 text-success-800 border-success-200';
    case 'connecting':
      return 'bg-warning-100 text-warning-800 border-warning-200';
    case 'offline':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'error':
      return 'bg-danger-100 text-danger-800 border-danger-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getConnectorStatusColor(status: ConnectorStatus): string {
  switch (status) {
    case 'Available':
      return 'bg-success-500';
    case 'Charging':
      return 'bg-primary-500 animate-pulse-slow';
    case 'Preparing':
    case 'Finishing':
      return 'bg-warning-500';
    case 'SuspendedEVSE':
    case 'SuspendedEV':
      return 'bg-warning-300';
    case 'Reserved':
      return 'bg-primary-300';
    case 'Unavailable':
    case 'Faulted':
      return 'bg-danger-500';
    default:
      return 'bg-gray-400';
  }
}

export function getTransactionStatusColor(status: TransactionStatus): string {
  switch (status) {
    case 'active':
      return 'text-primary-600';
    case 'completed':
      return 'text-success-600';
    case 'failed':
      return 'text-danger-600';
    default:
      return 'text-gray-600';
  }
}

export function getSimulationStatusColor(status: SimulationStatus): string {
  switch (status) {
    case 'running':
      return 'bg-primary-100 text-primary-800 border-primary-200';
    case 'completed':
      return 'bg-success-100 text-success-800 border-success-200';
    case 'stopped':
      return 'bg-warning-100 text-warning-800 border-warning-200';
    case 'error':
      return 'bg-danger-100 text-danger-800 border-danger-200';
    case 'created':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getEventLevelColor(level: EventLevel): string {
  switch (level) {
    case 'error':
      return 'text-danger-600';
    case 'warning':
      return 'text-warning-600';
    case 'info':
      return 'text-primary-600';
    case 'debug':
      return 'text-gray-500';
    default:
      return 'text-gray-600';
  }
}

export function getEventTypeDisplayName(eventType: string): string {
  switch (eventType) {
    case 'charger.boot_notification.sent':
      return 'Boot Notification';
    case 'charger.transaction.started':
      return 'Transaction Started';
    case 'charger.transaction.stopped':
      return 'Transaction Stopped';
    case 'charger.stopped':
      return 'Charger Stopped';
    case 'charger.status.changed':
      return 'Status Changed';
    case 'simulation.started':
      return 'Simulation Started';
    case 'simulation.stopped':
      return 'Simulation Stopped';
    case 'simulation.completed':
      return 'Simulation Completed';
    case 'ocpp.message.received':
      return 'OCPP Message In';
    case 'ocpp.message.sent':
      return 'OCPP Message Out';
    case 'chaos.injected':
      return 'Chaos Injected';
    case 'chaos.recovered':
      return 'Chaos Recovered';
    default:
      return eventType.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

export function truncateString(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
