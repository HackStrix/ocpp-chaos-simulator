'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DashboardShellProps {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
}

export function DashboardShell({ 
  title, 
  description, 
  children, 
  actions 
}: DashboardShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      {children}
    </div>
  )
}

interface DashboardCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function DashboardCard({ 
  title, 
  description, 
  children, 
  className 
}: DashboardCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
