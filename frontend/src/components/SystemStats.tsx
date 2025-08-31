'use client'

import { Activity, Zap, Cable, AlertTriangle } from 'lucide-react'

interface SystemStatsProps {
  stats: {
    totalChargers: number
    connectedChargers: number
    activeTransactions: number
    totalEvents: number
  }
  isConnected: boolean
}

export default function SystemStats({ stats, isConnected }: SystemStatsProps) {
  const connectionRate = stats.totalChargers > 0 
    ? Math.round((stats.connectedChargers / stats.totalChargers) * 100) 
    : 0

  const statItems = [
    {
      name: 'Total Chargers',
      value: stats.totalChargers,
      icon: Cable,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Connected',
      value: `${stats.connectedChargers} (${connectionRate}%)`,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Active Transactions',
      value: stats.activeTransactions,
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Total Events',
      value: stats.totalEvents,
      icon: AlertTriangle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">System Overview</h2>
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {isConnected ? 'Backend Connected' : 'Backend Disconnected'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.name} className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{item.name}</p>
                <p className="text-lg font-semibold text-gray-900">{item.value}</p>
              </div>
            </div>
          )
        })}
      </div>
      
      {stats.totalChargers > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Connection Health</span>
            <span className={`font-medium ${connectionRate >= 80 ? 'text-green-600' : connectionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {connectionRate}%
            </span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${connectionRate >= 80 ? 'bg-green-500' : connectionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${connectionRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
