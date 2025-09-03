'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSystemStatus, useHealthCheck } from '@/hooks/api'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { 
  Car, 
  Play, 
  Activity, 
  BarChart3, 
  Wifi, 
  WifiOff,
  Server,
  Database,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: BarChart3,
    description: 'System overview and statistics'
  },
  {
    name: 'Chargers',
    href: '/dashboard/chargers',
    icon: Car,
    description: 'Manage virtual chargers'
  },
  {
    name: 'Scenarios',
    href: '/dashboard/scenarios',
    icon: Play,
    description: 'Run simulation scenarios'
  },
  {
    name: 'Monitoring',
    href: '/dashboard/monitoring',
    icon: Activity,
    description: 'Real-time monitoring and logs'
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Performance analytics'
  },
]

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { data: systemStatus } = useSystemStatus()
  const { isHealthy, isLoading: healthLoading } = useHealthCheck()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-foreground">
                OCPP Chaos Simulator
              </h1>
              <div className="flex items-center space-x-2">
                {healthLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <>
                    {isHealthy ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={isHealthy ? 'success' : 'destructive'}>
                      {isHealthy ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {systemStatus && (
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4" />
                    <span>{systemStatus.active_chargers}/{systemStatus.total_chargers} Chargers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Play className="h-4 w-4" />
                    <span>{systemStatus.running_scenarios} Running</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4" />
                    <Badge variant={systemStatus.database_status === 'healthy' ? 'success' : 'warning'}>
                      {systemStatus.database_status}
                    </Badge>
                  </div>
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
