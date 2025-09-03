'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useChargers, useSystemStatus, useEvents } from '@/hooks/api'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Clock,
  PieChart,
  Users
} from 'lucide-react'
import { useMemo } from 'react'

export default function AnalyticsPage() {
  const { data: chargers = [], isLoading: chargersLoading } = useChargers()
  const { data: systemStatus, isLoading: statusLoading } = useSystemStatus()
  const { data: events = [], isLoading: eventsLoading } = useEvents({ limit: 1000 })

  // Calculate analytics data
  const analytics = useMemo(() => {
    // Charger analytics
    const connectedChargers = chargers.filter(c => c.connected).length
    const totalConnectors = chargers.reduce((total, c) => total + c.connectors.length, 0)
    const activeTransactions = chargers.reduce(
      (total, c) => total + (c.transactions || []).filter(t => t.status === 'active').length, 
      0
    )

    // Event analytics by type
    const eventsByType = events.reduce((acc, event) => {
      const type = event.type.split('.')[0] // Get base type (charger, simulation, etc.)
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Event analytics by level
    const eventsByLevel = events.reduce((acc, event) => {
      const level = (event.data as any)?.level || 'info'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Charger status distribution
    const chargersByStatus = chargers.reduce((acc, charger) => {
      acc[charger.status] = (acc[charger.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Connector status distribution
    const connectorsByStatus = chargers.reduce((acc, charger) => {
      charger.connectors.forEach(connector => {
        acc[connector.status] = (acc[connector.status] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    return {
      chargers: {
        total: chargers.length,
        connected: connectedChargers,
        connectionRate: chargers.length > 0 ? (connectedChargers / chargers.length) * 100 : 0,
        byStatus: chargersByStatus,
      },
      connectors: {
        total: totalConnectors,
        byStatus: connectorsByStatus,
      },
      transactions: {
        active: activeTransactions,
        utilizationRate: totalConnectors > 0 ? (activeTransactions / totalConnectors) * 100 : 0,
      },
      events: {
        total: events.length,
        byType: eventsByType,
        byLevel: eventsByLevel,
      },
    }
  }, [chargers, events])

  const isLoading = chargersLoading || statusLoading || eventsLoading

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">Performance metrics and system insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            Last 24h
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connection Rate</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <div className="flex items-center space-x-2 mt-2">
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.chargers.connectionRate.toFixed(1)}%
                    </p>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.chargers.connected}/{analytics.chargers.total} online
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilization Rate</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <div className="flex items-center space-x-2 mt-2">
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics.transactions.utilizationRate.toFixed(1)}%
                    </p>
                    {analytics.transactions.utilizationRate > 50 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {analytics.transactions.active} active sessions
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {analytics.events.total.toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Last 1000 events</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-20 mt-2" />
                ) : (
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {systemStatus?.uptime || '0s'}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Current session</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charger Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Charger Status Distribution</span>
            </CardTitle>
            <CardDescription>Current status of all virtual chargers</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(analytics.chargers.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`h-3 w-3 rounded-full ${
                        status === 'connected' ? 'bg-green-500' :
                        status === 'connecting' ? 'bg-yellow-500' :
                        status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm font-medium capitalize">{status}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{count}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({((count / analytics.chargers.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Event Type Distribution</span>
            </CardTitle>
            <CardDescription>Breakdown of system events by type</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(analytics.events.byType)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 6)
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium capitalize">
                          {type.replace(/\./g, ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{count}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({((count / analytics.events.total) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connector Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Connector Utilization</span>
          </CardTitle>
          <CardDescription>Distribution of connector statuses across all chargers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analytics.connectors.byStatus).map(([status, count]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{status}</p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'Available' ? 'bg-green-500' :
                        status === 'Charging' ? 'bg-blue-500' :
                        status === 'Preparing' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${(count / analytics.connectors.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
