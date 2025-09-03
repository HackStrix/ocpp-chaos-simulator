'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useEvents, useEventActions } from '@/hooks/api'
import { Activity, AlertCircle, Info, AlertTriangle, Bug, Filter, RefreshCw } from 'lucide-react'
import { formatTimestamp, getEventLevelColor, getEventTypeDisplayName } from '@/lib/utils'
import { cn } from '@/lib/utils'

const EVENT_LEVEL_FILTERS = [
  { value: 'all', label: 'All Levels', icon: Activity },
  { value: 'error', label: 'Errors', icon: AlertCircle },
  { value: 'warning', label: 'Warnings', icon: AlertTriangle },
  { value: 'info', label: 'Info', icon: Info },
  { value: 'debug', label: 'Debug', icon: Bug },
]

const EVENT_TYPE_FILTERS = [
  { value: 'all', label: 'All Types' },
  { value: 'charger', label: 'Charger Events' },
  { value: 'simulation', label: 'Simulation Events' },
  { value: 'ocpp', label: 'OCPP Messages' },
  { value: 'chaos', label: 'Chaos Events' },
]

export default function MonitoringPage() {
  const [levelFilter, setLevelFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const { 
    data: events = [], 
    isLoading, 
    error, 
    refetch 
  } = useEvents({ 
    limit: 100,
    level: levelFilter !== 'all' ? levelFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    autoRefresh,
  })

  const { clearEvents } = useEventActions()

  const eventStats = {
    total: events.length,
    errors: events.filter(e => (e.data as any)?.level === 'error').length,
    warnings: events.filter(e => (e.data as any)?.level === 'warning').length,
    info: events.filter(e => (e.data as any)?.level === 'info').length,
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <Activity className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
              <p className="text-gray-500 mb-4">Unable to load monitoring data.</p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
          <p className="text-gray-600 mt-1">Real-time events and system logs</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', autoRefresh && 'animate-spin')} />
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Event Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{eventStats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{eventStats.errors}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{eventStats.warnings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Info</p>
                <p className="text-2xl font-bold text-blue-600">{eventStats.info}</p>
              </div>
              <Info className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Level Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Event Level</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_LEVEL_FILTERS.map((filter) => {
                  const Icon = filter.icon
                  return (
                    <Button
                      key={filter.value}
                      variant={levelFilter === filter.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLevelFilter(filter.value)}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{filter.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Event Type</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPE_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={typeFilter === filter.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypeFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Event Log</CardTitle>
          <CardDescription>Real-time system events and activities</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
              <p className="mt-1 text-sm text-gray-500">
                No events match the current filters
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {getEventTypeDisplayName(event.type)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(event.timestamp)}
                        </p>
                        {event.data && typeof event.data === 'object' && (
                          <div className="mt-2 text-xs text-gray-600">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs',
                            (event.data as any)?.level && getEventLevelColor((event.data as any).level)
                          )}
                        >
                          {(event.data as any)?.level || 'info'}
                        </Badge>
                      </div>
                    </div>
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
