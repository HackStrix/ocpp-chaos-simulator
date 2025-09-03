'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useScenarios, useRunScenario, useStopScenario } from '@/hooks/api'
import { Play, Square, Clock, Users, Tag, Zap } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import { useState } from 'react'

export default function ScenariosPage() {
  const { data: scenarios = [], isLoading, error, refetch } = useScenarios()
  const runScenarioMutation = useRunScenario()
  const stopScenarioMutation = useStopScenario()
  const [runningScenarios, setRunningScenarios] = useState<Set<string>>(new Set())

  const handleRunScenario = async (scenarioName: string) => {
    try {
      setRunningScenarios(prev => new Set(prev).add(scenarioName))
      await runScenarioMutation.mutateAsync(scenarioName)
    } catch (error) {
      console.error('Failed to run scenario:', error)
      setRunningScenarios(prev => {
        const newSet = new Set(prev)
        newSet.delete(scenarioName)
        return newSet
      })
    }
  }

  const handleStopScenario = async (scenarioName: string) => {
    try {
      await stopScenarioMutation.mutateAsync(scenarioName)
      setRunningScenarios(prev => {
        const newSet = new Set(prev)
        newSet.delete(scenarioName)
        return newSet
      })
    } catch (error) {
      console.error('Failed to stop scenario:', error)
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Scenario Management</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <Play className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
              <p className="text-gray-500 mb-4">Unable to load scenarios. Please check the backend connection.</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Scenario Management</h2>
          <p className="text-gray-600 mt-1">Run and manage simulation scenarios</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {scenarios.length} scenarios available
          </Badge>
          <Badge variant="secondary">
            {runningScenarios.size} running
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Scenarios</p>
                <p className="text-2xl font-bold text-gray-900">{scenarios.length}</p>
              </div>
              <Play className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold text-green-600">{runningScenarios.size}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-500 rounded-full animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Chargers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {scenarios.reduce((total, s) => total + s.chargers.count, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-orange-600">
                  {scenarios.length > 0 
                    ? formatDuration(Math.round(scenarios.reduce((total, s) => total + s.duration, 0) / scenarios.length))
                    : '0s'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          [...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : scenarios.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <Play className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No scenarios</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No simulation scenarios are currently available
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Scenario cards
          scenarios.map((scenario) => {
            const isRunning = runningScenarios.has(scenario.name)
            const isLoading = runScenarioMutation.isPending || stopScenarioMutation.isPending
            
            return (
              <Card key={scenario.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Play className="h-5 w-5" />
                      <span className="truncate">{scenario.name}</span>
                    </div>
                    {isRunning && (
                      <Badge variant="success" className="animate-pulse">
                        Running
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {scenario.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Scenario Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{formatDuration(scenario.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{scenario.chargers.count} chargers</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-gray-400" />
                        <span>OCPP {scenario.csms.protocol}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 text-gray-400 flex items-center">v</div>
                        <span>{scenario.version}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {scenario.tags && scenario.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {scenario.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {scenario.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{scenario.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2 border-t">
                      {isRunning ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleStopScenario(scenario.name)}
                          disabled={isLoading}
                          className="w-full"
                        >
                          <Square className="h-4 w-4 mr-2" />
                          {isLoading ? 'Stopping...' : 'Stop Scenario'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleRunScenario(scenario.name)}
                          disabled={isLoading}
                          className="w-full"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {isLoading ? 'Starting...' : 'Run Scenario'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
