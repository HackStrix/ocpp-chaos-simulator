'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useChargers, useCreateCharger, useDeleteCharger } from '@/hooks/api'
import { CreateChargerRequest } from '@/lib/api'
import { Plus, Car, Wifi, WifiOff, Trash2, Zap, Clock, User } from 'lucide-react'
import { getChargerStatusColor, getConnectorStatusColor, formatTimestamp } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ChargersPage() {
  const { data: chargers = [], isLoading, error, refetch } = useChargers()
  const createChargerMutation = useCreateCharger()
  const deleteChargerMutation = useDeleteCharger()
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleCreateCharger = async (data: CreateChargerRequest) => {
    try {
      await createChargerMutation.mutateAsync(data)
      setShowCreateForm(false)
    } catch (error) {
      console.error('Failed to create charger:', error)
    }
  }

  const handleDeleteCharger = async (id: number) => {
    if (confirm('Are you sure you want to delete this charger?')) {
      try {
        await deleteChargerMutation.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete charger:', error)
      }
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Charger Management</h2>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">
                <Car className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
              <p className="text-gray-500 mb-4">Unable to load chargers. Please check the backend connection.</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Charger Management</h2>
          <p className="text-gray-600 mt-1">Manage virtual OCPP chargers</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          disabled={createChargerMutation.isPending}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Charger</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Chargers</p>
                <p className="text-2xl font-bold text-gray-900">{chargers.length}</p>
              </div>
              <Car className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected</p>
                <p className="text-2xl font-bold text-green-600">
                  {chargers.filter(c => c.connected).length}
                </p>
              </div>
              <Wifi className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Transactions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {chargers.reduce((total, charger) => 
                    total + (charger.transactions || []).filter(t => t.status === 'active').length, 0
                  )}
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Connectors</p>
                <p className="text-2xl font-bold text-orange-600">
                  {chargers.reduce((total, charger) => total + charger.connectors.length, 0)}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-orange-500 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chargers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          // Loading skeletons
          [...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : chargers.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <Car className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No chargers</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new virtual charger
                  </p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Charger
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Charger cards
          chargers.map((charger) => (
            <Card key={charger.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Car className="h-5 w-5" />
                    <span>{charger.id}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {charger.connected ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-gray-400" />
                    )}
                    <Badge className={getChargerStatusColor(charger.status)}>
                      {charger.status}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  {charger.config.vendor} {charger.config.model} • OCPP {charger.config.ocpp_version}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Connectors */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Connectors</h4>
                    <div className="flex space-x-2">
                      {charger.connectors.map((connector) => (
                        <div key={connector.id} className="flex items-center space-x-1">
                          <div
                            className={cn(
                              'h-3 w-3 rounded-full',
                              getConnectorStatusColor(connector.status)
                            )}
                            title={`Connector ${connector.id}: ${connector.status}`}
                          />
                          <span className="text-xs text-gray-600">{connector.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Transactions */}
                  {charger.transactions && charger.transactions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Active Transactions</h4>
                      <div className="space-y-1">
                        {charger.transactions.slice(0, 2).map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <Zap className="h-3 w-3 text-yellow-500" />
                              <span>C{transaction.connector_id}</span>
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">{transaction.id_tag}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {transaction.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Heartbeat */}
                  {charger.last_heartbeat && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>Last heartbeat: {formatTimestamp(charger.last_heartbeat)}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end pt-2 border-t">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCharger(Number(charger.id))}
                      disabled={deleteChargerMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Charger Form - simplified for now */}
      {showCreateForm && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Create New Charger</CardTitle>
            <CardDescription>Add a virtual OCPP charger to the simulation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={() => handleCreateCharger({
                  identifier: `CHARGER_${Date.now()}`,
                  model: 'Virtual Charger',
                  vendor: 'OCPP Simulator',
                  connector_count: 2,
                  ocpp_version: '1.6'
                })}
                disabled={createChargerMutation.isPending}
                className="w-full"
              >
                {createChargerMutation.isPending ? 'Creating...' : 'Create Charger'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
