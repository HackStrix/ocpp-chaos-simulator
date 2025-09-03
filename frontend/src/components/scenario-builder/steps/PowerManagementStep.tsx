'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Battery, Plus, Trash2, CheckCircle, AlertTriangle, MessageSquare, Target, Zap } from 'lucide-react'
import { ScenarioData, ChargingPriority } from '../ScenarioBuilder'

interface PowerManagementStepProps {
  data: ScenarioData
  onUpdate: (data: ScenarioData) => void
}

const POWER_TEST_SCENARIOS = [
  { 
    id: 'over_capacity',
    name: 'Over-Capacity Load Balancing', 
    description: 'Test CSMS when total demand exceeds site capacity',
    chargerCount: 20,
    siteCapacity: 400,
    requestedPower: 32
  },
  { 
    id: 'priority_allocation',
    name: 'Priority-Based Power Allocation', 
    description: 'Test CSMS priority handling with SetChargingProfile',
    chargerCount: 15,
    siteCapacity: 300,
    requestedPower: 32
  },
  { 
    id: 'dynamic_rebalancing',
    name: 'Dynamic Power Rebalancing', 
    description: 'Test CSMS reallocation when chargers disconnect',
    chargerCount: 10,
    siteCapacity: 200,
    requestedPower: 32
  }
]

const CSMS_VALIDATION_RULES = [
  { 
    name: 'SetChargingProfile Compliance',
    description: 'Validate CSMS sends SetChargingProfile when power needs reduction',
    ocppMessage: 'SetChargingProfile',
    validation: 'chargingSchedule.chargingRateUnit === "A" && sum(limit) <= siteMaxAmperage'
  },
  {
    name: 'ChangeAvailability Response',
    description: 'Validate CSMS uses ChangeAvailability for load shedding',
    ocppMessage: 'ChangeAvailability',
    validation: 'type === "Inoperative" when exceeding capacity'
  },
  {
    name: 'StartTransaction Rejection',
    description: 'Validate CSMS rejects StartTransaction when over capacity',
    ocppMessage: 'StartTransactionResponse',
    validation: 'idTagInfo.status === "Blocked" when no power available'
  }
]

export function PowerManagementStep({ data, onUpdate }: PowerManagementStepProps) {
  const [selectedScenario, setSelectedScenario] = useState('')
  const [validationRules, setValidationRules] = useState<string[]>([])

  const updateField = (field: keyof ScenarioData, value: any) => {
    onUpdate({ ...data, [field]: value })
  }

  const calculateExpectedReduction = () => {
    const totalDemand = data.chargerCount * data.chargerMaxAmperage
    if (totalDemand <= data.siteMaxAmperage) return 0
    return ((totalDemand - data.siteMaxAmperage) / totalDemand * 100).toFixed(1)
  }

  const getExpectedCSMSBehavior = () => {
    const totalDemand = data.chargerCount * data.chargerMaxAmperage
    const isOverCapacity = totalDemand > data.siteMaxAmperage
    const expectedPerCharger = Math.min(data.chargerMaxAmperage, Math.floor(data.siteMaxAmperage / data.chargerCount))
    
    return {
      isOverCapacity,
      expectedPerCharger,
      totalDemand,
      shouldSendSetChargingProfile: isOverCapacity,
      shouldRejectNewSessions: data.chargerCount * expectedPerCharger >= data.siteMaxAmperage
    }
  }

  const applyTestScenario = () => {
    const scenario = POWER_TEST_SCENARIOS.find(s => s.id === selectedScenario)
    if (scenario) {
      updateField('powerManagementEnabled', true)
      updateField('chargerCount', scenario.chargerCount)
      updateField('siteMaxAmperage', scenario.siteCapacity)
      updateField('chargerMaxAmperage', scenario.requestedPower)
      updateField('name', scenario.name)
      updateField('description', scenario.description)
      setSelectedScenario('')
    }
  }

  const toggleValidationRule = (ruleIndex: number) => {
    const ruleName = CSMS_VALIDATION_RULES[ruleIndex].name
    if (validationRules.includes(ruleName)) {
      setValidationRules(validationRules.filter(r => r !== ruleName))
    } else {
      setValidationRules([...validationRules, ruleName])
    }
  }

  const csmsExpectedBehavior = getExpectedCSMSBehavior()

  return (
    <div className="space-y-6">
      {/* CSMS Testing Overview */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span>CSMS Load Balancing Validation</span>
          </CardTitle>
          <p className="text-gray-600">Test CSMS OCPP 1.6J responses and validate load balancing logic implementation</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="powerManagementEnabled"
              checked={data.powerManagementEnabled}
              onChange={(e) => updateField('powerManagementEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <Label htmlFor="powerManagementEnabled">Enable CSMS load balancing validation testing</Label>
          </div>

          {data.powerManagementEnabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Test Approach</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Virtual chargers request power from CSMS</li>
                <li>• Validate CSMS sends proper SetChargingProfile responses</li>
                <li>• Test CSMS load balancing algorithm compliance</li>
                <li>• Verify CSMS respects amperage limits in responses</li>
                <li>• Check CSMS rejection logic when over capacity</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {data.powerManagementEnabled && (
        <>
          {/* Quick Test Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>CSMS Test Scenarios</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Pre-configured scenarios to test specific CSMS load balancing behaviors</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                >
                  <option value="">Choose CSMS test scenario...</option>
                  {POWER_TEST_SCENARIOS.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.name} - {scenario.description}
                    </option>
                  ))}
                </Select>
                <Button onClick={applyTestScenario} disabled={!selectedScenario} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Apply Scenario
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {POWER_TEST_SCENARIOS.map(scenario => (
                  <Card key={scenario.id} className="border-dashed border-2 border-gray-300 hover:border-blue-400 cursor-pointer" 
                        onClick={() => {setSelectedScenario(scenario.id); applyTestScenario()}}>
                    <CardContent className="p-4 text-center">
                      <h4 className="font-medium text-gray-900 mb-1">{scenario.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                      <div className="text-xs text-gray-500">
                        {scenario.chargerCount} chargers × {scenario.requestedPower}A = {scenario.chargerCount * scenario.requestedPower}A
                        <br />
                        Site: {scenario.siteCapacity}A
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Power Configuration for CSMS Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Power Configuration</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Configure power parameters to test CSMS load balancing responses</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteMaxAmperage">Site Max Amperage (A) *</Label>
                  <Input
                    id="siteMaxAmperage"
                    type="number"
                    value={data.siteMaxAmperage}
                    onChange={(e) => updateField('siteMaxAmperage', parseInt(e.target.value) || 0)}
                    min="50"
                    max="2000"
                  />
                  <p className="text-sm text-gray-500">CSMS should not allocate more than this total</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chargerMaxAmperage">Requested Power per Charger (A) *</Label>
                  <Input
                    id="chargerMaxAmperage"
                    type="number"
                    value={data.chargerMaxAmperage}
                    onChange={(e) => updateField('chargerMaxAmperage', parseInt(e.target.value) || 0)}
                    min="6"
                    max="80"
                  />
                  <p className="text-sm text-gray-500">Power each charger will request from CSMS</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loadBalancingStrategy">Expected CSMS Strategy</Label>
                <Select
                  id="loadBalancingStrategy"
                  value={data.loadBalancingStrategy}
                  onChange={(e) => updateField('loadBalancingStrategy', e.target.value)}
                >
                  <option value="proportional">Proportional - Equal reduction across all chargers</option>
                  <option value="priority">Priority-Based - Reduce low priority chargers first</option>
                  <option value="round_robin">Round Robin - Cycle through chargers</option>
                  <option value="first_come_first_served">FCFS - First connected gets priority</option>
                </Select>
                <p className="text-sm text-gray-500">Expected CSMS load balancing algorithm to validate against</p>
              </div>
            </CardContent>
          </Card>

          {/* CSMS Expected Behavior Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Expected CSMS Behavior</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Analysis of what the CSMS should do with current configuration</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Power Analysis</h4>
                  <div className="text-sm space-y-1">
                    <div><strong>Total Requested:</strong> {csmsExpectedBehavior.totalDemand}A</div>
                    <div><strong>Site Capacity:</strong> {data.siteMaxAmperage}A</div>
                    <div><strong>Per Charger Expected:</strong> {csmsExpectedBehavior.expectedPerCharger}A</div>
                    <div className={`font-medium ${csmsExpectedBehavior.isOverCapacity ? 'text-red-600' : 'text-green-600'}`}>
                      <strong>Status:</strong> {csmsExpectedBehavior.isOverCapacity ? 'Over Capacity' : 'Within Capacity'}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Expected CSMS Actions</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex items-center space-x-2">
                      {csmsExpectedBehavior.shouldSendSetChargingProfile ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-gray-300" />
                      )}
                      <span>Send SetChargingProfile messages</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {csmsExpectedBehavior.shouldRejectNewSessions ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-gray-300" />
                      )}
                      <span>Reject new StartTransaction requests</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {csmsExpectedBehavior.isOverCapacity ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-gray-300" />
                      )}
                      <span>Implement load balancing algorithm</span>
                    </div>
                  </div>
                </div>
              </div>

              {csmsExpectedBehavior.isOverCapacity && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm text-orange-800">
                      <strong>CSMS Load Balancing Required:</strong> Total demand ({csmsExpectedBehavior.totalDemand}A) exceeds capacity. 
                      CSMS should reduce each charger to ~{csmsExpectedBehavior.expectedPerCharger}A via SetChargingProfile.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OCPP Message Validation Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>OCPP 1.6J Response Validation</span>
              </CardTitle>
              <p className="text-sm text-gray-600">Define which CSMS responses to validate during testing</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {CSMS_VALIDATION_RULES.map((rule, index) => (
                <Card key={index} className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={validationRules.includes(rule.name)}
                            onChange={() => toggleValidationRule(index)}
                            className="h-4 w-4 text-purple-600 rounded border-gray-300"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">{rule.name}</h4>
                            <p className="text-sm text-gray-600">{rule.description}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded">
                          <strong>OCPP Message:</strong> {rule.ocppMessage}<br/>
                          <strong>Validation:</strong> {rule.validation}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Testing Instructions */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h3 className="font-medium text-green-900 mb-2 flex items-center">
                <Battery className="h-4 w-4 mr-2" />
                CSMS Load Balancing Test Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                <div>
                  <h4 className="font-medium mb-1">Scenario Execution</h4>
                  <ul className="space-y-1">
                    <li>• Virtual chargers connect and request {data.chargerMaxAmperage}A each</li>
                    <li>• Monitor CSMS SetChargingProfile responses</li>
                    <li>• Validate power allocation stays ≤ {data.siteMaxAmperage}A total</li>
                    <li>• Test dynamic rebalancing when chargers disconnect</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Response Validation</h4>
                  <ul className="space-y-1">
                    <li>• Check OCPP message format compliance</li>
                    <li>• Verify amperage limits in charging profiles</li>
                    <li>• Validate response timing (≤ 30 seconds)</li>
                    <li>• Test error handling for invalid requests</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}