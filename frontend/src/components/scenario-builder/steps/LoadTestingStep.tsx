'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Users, Activity, AlertTriangle } from 'lucide-react'
import { ScenarioData } from '../ScenarioBuilder'

interface LoadTestingStepProps {
  data: ScenarioData
  onUpdate: (data: ScenarioData) => void
}

export function LoadTestingStep({ data, onUpdate }: LoadTestingStepProps) {
  const updateField = (field: keyof ScenarioData, value: any) => {
    onUpdate({ ...data, [field]: value })
  }

  const calculateTotalDuration = () => {
    return data.rampUpDuration + data.steadyStateDuration + data.rampDownDuration
  }

  const getLoadCategory = () => {
    if (data.chargerCount > 1000) return { label: 'Extreme Load', color: 'bg-red-500', icon: '🔥' }
    if (data.chargerCount > 500) return { label: 'Heavy Load', color: 'bg-orange-500', icon: '⚡' }
    if (data.chargerCount > 100) return { label: 'Medium Load', color: 'bg-yellow-500', icon: '⚖️' }
    return { label: 'Light Load', color: 'bg-green-500', icon: '🟢' }
  }

  const loadCategory = getLoadCategory()

  return (
    <div className="space-y-6">
      {/* Load Overview */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span>CSMS Load Testing Configuration</span>
          </CardTitle>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className={`${loadCategory.color} text-white`}>
              {loadCategory.icon} {loadCategory.label}
            </Badge>
            <span className="text-sm text-gray-600">
              {data.chargerCount} chargers • {data.chargerCount * data.connectors} total connectors
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* Charger Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Virtual Charger Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chargerCount">Number of Chargers *</Label>
              <Input
                id="chargerCount"
                type="number"
                value={data.chargerCount}
                onChange={(e) => updateField('chargerCount', parseInt(e.target.value) || 0)}
                min="1"
                max="2000"
              />
              <p className="text-sm text-gray-500">For CSMS load testing: 100-500+ recommended</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="connectors">Connectors per Charger</Label>
              <Select
                id="connectors"
                value={data.connectors.toString()}
                onChange={(e) => updateField('connectors', parseInt(e.target.value))}
              >
                <option value="1">1 Connector</option>
                <option value="2">2 Connectors</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chargerModel">Charger Model</Label>
              <Input
                id="chargerModel"
                value={data.chargerModel}
                onChange={(e) => updateField('chargerModel', e.target.value)}
                placeholder="e.g., FastCharger, LoadTestCharger"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chargerVendor">Vendor</Label>
              <Input
                id="chargerVendor"
                value={data.chargerVendor}
                onChange={(e) => updateField('chargerVendor', e.target.value)}
                placeholder="e.g., TestCorp, LoadTestCorp"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ocppVersion">OCPP Version</Label>
              <Select
                id="ocppVersion"
                value={data.ocppVersion}
                onChange={(e) => updateField('ocppVersion', e.target.value)}
              >
                <option value="1.6">OCPP 1.6</option>
                <option value="2.0">OCPP 2.0</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="csmsEndpoint">CSMS Endpoint *</Label>
              <Input
                id="csmsEndpoint"
                value={data.csmsEndpoint}
                onChange={(e) => updateField('csmsEndpoint', e.target.value)}
                placeholder="ws://localhost:8080/ocpp"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Load Profile Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Load Profile</span>
          </CardTitle>
          <p className="text-sm text-gray-600">Configure how chargers connect and disconnect over time</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useLoadProfile"
              checked={data.useLoadProfile}
              onChange={(e) => updateField('useLoadProfile', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <Label htmlFor="useLoadProfile">Use gradual load profile (recommended for CSMS testing)</Label>
          </div>

          {data.useLoadProfile && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              {/* Ramp Up */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  📈 Ramp Up Phase
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Chargers per Second</Label>
                    <Input
                      type="number"
                      value={data.rampUpRate}
                      onChange={(e) => updateField('rampUpRate', parseInt(e.target.value) || 0)}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={data.rampUpDuration}
                      onChange={(e) => updateField('rampUpDuration', parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Will connect {data.rampUpRate * data.rampUpDuration} chargers in {data.rampUpDuration} seconds
                </p>
              </div>

              {/* Steady State */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  📊 Steady State Phase
                </h4>
                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <Input
                    type="number"
                    value={data.steadyStateDuration}
                    onChange={(e) => updateField('steadyStateDuration', parseInt(e.target.value) || 0)}
                    min="1"
                  />
                  <p className="text-sm text-gray-500">
                    All chargers active for {Math.floor(data.steadyStateDuration / 60)} minutes
                  </p>
                </div>
              </div>

              {/* Ramp Down */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  📉 Ramp Down Phase
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Disconnections per Second</Label>
                    <Input
                      type="number"
                      value={data.rampDownRate}
                      onChange={(e) => updateField('rampDownRate', parseInt(e.target.value) || 0)}
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={data.rampDownDuration}
                      onChange={(e) => updateField('rampDownDuration', parseInt(e.target.value) || 0)}
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Timeline Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Load Timeline Summary</h4>
                <div className="text-sm text-blue-800">
                  <div>Total Duration: <strong>{calculateTotalDuration()} seconds</strong></div>
                  <div>Peak Concurrent Chargers: <strong>{Math.min(data.chargerCount, data.rampUpRate * data.rampUpDuration)}</strong></div>
                  <div>Connection Rate: <strong>{data.rampUpRate}/sec up</strong>, <strong>{data.rampDownRate}/sec down</strong></div>
                </div>
              </div>

              {calculateTotalDuration() !== data.duration && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Load profile duration ({calculateTotalDuration()}s) doesn&apos;t match total scenario duration ({data.duration}s)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSMS Load Testing Recommendations */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-green-900 mb-2">🎯 CSMS Load Testing Best Practices</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• <strong>Start with 100-200 chargers</strong> to baseline your CSMS performance</li>
            <li>• <strong>Use gradual ramp-up</strong> to simulate realistic deployment scenarios</li>
            <li>• <strong>Monitor connection handling</strong> - test peak concurrent connection limits</li>
            <li>• <strong>Test message throughput</strong> - ensure CSMS can handle message bursts</li>
            <li>• <strong>Verify load balancing</strong> - check if connections distribute properly</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}