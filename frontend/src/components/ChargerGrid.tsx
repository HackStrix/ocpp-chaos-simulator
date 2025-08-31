'use client'

import { VirtualCharger } from '@/types/ocpp'
import { getChargerStatusColor, getConnectorStatusColor, getTransactionStatusColor, formatTimestamp } from '@/lib/utils'
import { Cable, Zap, Clock, User, Wifi, WifiOff } from 'lucide-react'

interface ChargerGridProps {
  chargers: VirtualCharger[]
}

export default function ChargerGrid({ chargers }: ChargerGridProps) {
  if (chargers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Virtual Chargers</h2>
        <div className="text-center py-12">
          <Cable className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No chargers</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start by running a scenario to create virtual chargers
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Virtual Chargers</h2>
        <span className="text-sm text-gray-500">{chargers.length} charger{chargers.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chargers.map((charger) => (
          <div key={charger.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* Charger Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Cable className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">{charger.id}</h3>
              </div>
              <div className="flex items-center space-x-2">
                {charger.connected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-400" />
                )}
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getChargerStatusColor(charger.status)}`}>
                  {charger.status}
                </span>
              </div>
            </div>

            {/* Charger Info */}
            <div className="text-sm text-gray-600 mb-3">
              <p>{charger.config.vendor} {charger.config.model}</p>
              <p>OCPP {charger.config.ocpp_version}</p>
              {charger.last_heartbeat && (
                <p className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Last heartbeat: {formatTimestamp(charger.last_heartbeat)}</span>
                </p>
              )}
            </div>

            {/* Connectors */}
            <div className="mb-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Connectors</h4>
              <div className="flex space-x-2">
                {charger.connectors.map((connector) => (
                  <div key={connector.id} className="flex items-center space-x-1">
                    <div
                      className={`h-3 w-3 rounded-full ${getConnectorStatusColor(connector.status)}`}
                      title={`Connector ${connector.id}: ${connector.status}`}
                    />
                    <span className="text-xs text-gray-600">{connector.id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Transactions */}
            {charger.transactions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Active Transactions</h4>
                <div className="space-y-1">
                  {charger.transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span>Connector {transaction.connector_id}</span>
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{transaction.id_tag}</span>
                      </div>
                      <span className={`font-medium ${getTransactionStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
