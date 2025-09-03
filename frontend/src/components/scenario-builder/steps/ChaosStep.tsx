'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Target, Plus, Trash2, Wifi, WifiOff, Zap, AlertTriangle, Clock } from 'lucide-react'
import { ScenarioData, ChaosStrategy } from '../ScenarioBuilder'

interface ChaosStepProps {
  data: ScenarioData
  onUpdate: (data: ScenarioData) => void
}

const CHAOS_STRATEGIES = [
  {
    id: 'network_loss',
    name: 'Network Loss',
    description: 'Simulate connection drops and reconnections',
    icon: WifiOff,
    color: 'text-red-600',
    params: ['duration', 'reconnect_delay']
  },
  {
    id: 'message_corruption',
    name: 'Message Corruption',
    description: 'Send malformed OCPP messages',
    icon: AlertTriangle,
    color: 'text-orange-600',
    params: ['corruption_rate', 'message_types']
  },
  {
    id: 'connection_flooding',
    name: 'Connection Flooding',
    description: 'Rapid connection/disconnection cycles',
    icon: Zap,
    color: 'text-purple-600',
    params: ['rate', 'burst_duration']
  },
  {
    id: 'response_delay',
    name: 'Response Delay',
    description: 'Simulate slow CSMS responses',
    icon: Clock,
    color: 'text-yellow-600',
    params: ['min_delay', 'max_delay']
  }
]

export function ChaosStep({ data, onUpdate }: ChaosStepProps) {
  const [selectedStrategy, setSelectedStrategy] = useState('')

  const updateField = (field: keyof ScenarioData, value: any) => {
    onUpdate({ ...data, [field]: value })
  }

  const addChaosStrategy = () => {
    const strategy = CHAOS_STRATEGIES.find(s => s.id === selectedStrategy)
    if (strategy) {
      const newStrategy: ChaosStrategy = {
        id: Date.now().toString(),
        name: strategy.id,
        enabled: true,
        startTime: 120, // Default to 2 minutes in
        duration: 60,
        target: 'random_20_percent',
        params: getDefaultParams(strategy.id)
      }
      updateField('chaosStrategies', [...data.chaosStrategies, newStrategy])
      setSelectedStrategy('')
    }
  }

  const updateStrategy = (id: string, updates: Partial<ChaosStrategy>) => {
    const updatedStrategies = data.chaosStrategies.map(strategy =>
      strategy.id === id ? { ...strategy, ...updates } : strategy
    )
    updateField('chaosStrategies', updatedStrategies)
  }

  const removeStrategy = (id: string) => {
    updateField('chaosStrategies', data.chaosStrategies.filter(s => s.id !== id))
  }

  const getDefaultParams = (strategyId: string): Record<string, any> => {
    switch (strategyId) {
      case 'network_loss':
        return { duration: 30, reconnect_delay: 5 }
      case 'message_corruption':
        return { corruption_rate: 0.1, message_types: ['all'] }
      case 'connection_flooding':
        return { rate: 10, burst_duration: 30 }
      case 'response_delay':
        return { min_delay: 1000, max_delay: 5000 }
      default:
        return {}
    }
  }

  const getStrategyInfo = (strategyName: string) => {
    return CHAOS_STRATEGIES.find(s => s.id === strategyName) || CHAOS_STRATEGIES[0]
  }

  return (
    <div className="space-y-6">
      {/* Chaos Testing Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-red-600" />
            <span>Chaos Engineering</span>
          </CardTitle>
          <p className="text-gray-600">Test your CSMS resilience by injecting controlled failures</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="chaosEnabled"
              checked={data.chaosEnabled}
              onChange={(e) => updateField('chaosEnabled', e.target.checked)}
              className="h-4 w-4 text-red-600 rounded border-gray-300"
            />
            <Label htmlFor="chaosEnabled">Enable chaos testing (recommended for CSMS validation)</Label>
          </div>

          {data.chaosEnabled && (
            <div className="flex items-center space-x-3">
              <Select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
              >
                <option value="">Add chaos strategy...</option>
                {CHAOS_STRATEGIES.map(strategy => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name} - {strategy.description}
                  </option>
                ))}
              </Select>
              <Button 
                onClick={addChaosStrategy} 
                disabled={!selectedStrategy}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Strategy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chaos Strategies */}
      {data.chaosEnabled && (
        <div className="space-y-4">
          {data.chaosStrategies.length === 0 ? (
            <Card className="border-dashed border-2 border-red-300">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Chaos Strategies</h3>
                <p className="text-gray-500 mb-4">Add chaos strategies to test CSMS resilience</p>
              </CardContent>
            </Card>
          ) : (
            data.chaosStrategies.map((strategy) => {
              const strategyInfo = getStrategyInfo(strategy.name)
              const StrategyIcon = strategyInfo.icon
              
              return (
                <Card key={strategy.id} className="border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StrategyIcon className={`h-5 w-5 ${strategyInfo.color}`} />
                        <div>
                          <CardTitle className="text-lg">{strategyInfo.name}</CardTitle>
                          <p className="text-sm text-gray-600">{strategyInfo.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={strategy.enabled}
                          onChange={(e) => updateStrategy(strategy.id, { enabled: e.target.checked })}
                          className="h-4 w-4 text-red-600 rounded border-gray-300"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStrategy(strategy.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Start Time (seconds)</Label>
                        <Input
                          type="number"
                          value={strategy.startTime}
                          onChange={(e) => updateStrategy(strategy.id, { startTime: parseInt(e.target.value) || 0 })}
                          min="0"
                          max={data.duration}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (seconds)</Label>
                        <Input
                          type="number"
                          value={strategy.duration}
                          onChange={(e) => updateStrategy(strategy.id, { duration: parseInt(e.target.value) || 0 })}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Target Chargers</Label>
                        <Select
                          value={strategy.target}
                          onChange={(e) => updateStrategy(strategy.id, { target: e.target.value })}
                        >
                          <option value="all">All Chargers</option>
                          <option value="random_10_percent">Random 10%</option>
                          <option value="random_20_percent">Random 20%</option>
                          <option value="random_50_percent">Random 50%</option>
                          <option value="first_quarter">First Quarter</option>
                          <option value="last_quarter">Last Quarter</option>
                        </Select>
                      </div>
                    </div>

                    {/* Strategy-specific parameters */}
                    {strategy.name === 'network_loss' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Reconnect Delay (seconds)</Label>
                            <Input
                              type="number"
                              value={strategy.params.reconnect_delay || 5}
                              onChange={(e) => updateStrategy(strategy.id, {
                                params: { ...strategy.params, reconnect_delay: parseInt(e.target.value) || 5 }
                              })}
                            />
                          </div>
                          <div className="flex items-center space-x-2 pt-6">
                            <input
                              type="checkbox"
                              checked={strategy.params.auto_reconnect !== false}
                              onChange={(e) => updateStrategy(strategy.id, {
                                params: { ...strategy.params, auto_reconnect: e.target.checked }
                              })}
                              className="h-4 w-4 text-red-600 rounded border-gray-300"
                            />
                            <Label>Auto-reconnect after failure</Label>
                          </div>
                        </div>
                      </div>
                    )}

                    {strategy.name === 'message_corruption' && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Corruption Rate (0-1)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              value={strategy.params.corruption_rate || 0.1}
                              onChange={(e) => updateStrategy(strategy.id, {
                                params: { ...strategy.params, corruption_rate: parseFloat(e.target.value) || 0.1 }
                              })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Message Types</Label>
                            <Select
                              value={strategy.params.message_types || 'all'}
                              onChange={(e) => updateStrategy(strategy.id, {
                                params: { ...strategy.params, message_types: e.target.value }
                              })}
                            >
                              <option value="all">All Messages</option>
                              <option value="transactions">Transaction Messages</option>
                              <option value="status">Status Messages</option>
                              <option value="heartbeat">Heartbeat Messages</option>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* CSMS Chaos Testing Guide */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-red-900 mb-2 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            CSMS Resilience Testing Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-red-800">
            <div>
              <h4 className="font-medium mb-1">Network Failures</h4>
              <ul className="space-y-1">
                <li>• Test connection recovery after network drops</li>
                <li>• Verify transaction state persistence</li>
                <li>• Check load balancer failover behavior</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-1">Message Chaos</h4>
              <ul className="space-y-1">
                <li>• Test malformed message handling</li>
                <li>• Verify error response accuracy</li>
                <li>• Check message rate limiting</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}