'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemStatus, useChargers, useScenarios, useEvents } from '@/hooks/api'
import { 
  Car, 
  Play, 
  Activity, 
  Database,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { formatTimestamp } from '@/lib/utils'

export default function DashboardOverview() {
  const { data: systemStatus, isLoading: systemLoading } = useSystemStatus()
  const { data: chargers = [], isLoading: chargersLoading } = useChargers()
  const { data: scenarios = [], isLoading: scenariosLoading } = useScenarios()
  const { data: events = [], isLoading: eventsLoading } = useEvents({ limit: 10 })

  const stats = [
    {
      title: 'Total Chargers',
      value: systemStatus?.total_chargers || chargers.length,
      change: `${systemStatus?.active_chargers || 0} active`,
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Running Scenarios',
      value: systemStatus?.running_scenarios || 0,
      change: `${scenarios.length} total`,
      icon: Play,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Messages',
      value: systemStatus?.total_messages || 0,
      change: 'All time',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'System Uptime',
      value: systemStatus?.uptime || 'Unknown',
      change: systemStatus?.database_status || 'Unknown',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-muted-foreground mt-1">
          Monitor your OCPP chaos simulation environment
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                                  <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {systemLoading ? (
                      <Skeleton className="h-8 w-20" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
            <CardDescription>Current system health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            {systemLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : systemStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Service Status</span>
                  <Badge variant="success" className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{systemStatus.status}</span>
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <Badge variant={systemStatus.database_status === 'healthy' ? 'success' : 'warning'}>
                    {systemStatus.database_status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Updated</span>
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(systemStatus.timestamp)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Unable to load system status</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Recent Events</span>
            </CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="space-y-4">
                {events.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {event.type.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent events</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
