'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X, ChevronLeft, ChevronRight, Download, Eye, Zap, Target, Clock, Settings, Battery, MessageSquare } from 'lucide-react'

import { BasicInfoStep } from './steps/BasicInfoStep'
import { LoadTestingStep } from './steps/LoadTestingStep'
import { PowerManagementStep } from './steps/PowerManagementStep'
import { TimelineStep } from './steps/TimelineStep'
import { ChaosStep } from './steps/ChaosStep'
import { PreviewStep } from './steps/PreviewStep'

interface ScenarioBuilderProps {
  onClose: () => void
}

const STEPS = [
  { id: 'basic', title: 'Basic Info', description: 'Scenario details', icon: Settings },
  { id: 'load', title: 'Load Testing', description: 'Charger configuration', icon: Zap },
  { id: 'power', title: 'Power Management', description: 'Load balancing & scheduling', icon: Battery },
  { id: 'timeline', title: 'Timeline', description: 'Message flows', icon: Clock },
  { id: 'chaos', title: 'Chaos Testing', description: 'Failure scenarios', icon: Target },
  { id: 'preview', title: 'Preview & Export', description: 'Review scenario', icon: Eye },
]

export interface ScenarioData {
  // Basic Info
  name: string
  description: string
  duration: number
  tags: string[]
  version: string
  
  // Load Testing
  chargerCount: number
  chargerModel: string
  chargerVendor: string
  connectors: number
  ocppVersion: string
  csmsEndpoint: string
  
  // Load Profile
  useLoadProfile: boolean
  rampUpRate: number
  rampUpDuration: number
  steadyStateDuration: number
  rampDownRate: number
  rampDownDuration: number
  
  // Power Management
  powerManagementEnabled: boolean
  siteMaxAmperage: number
  chargerMaxAmperage: number
  smartSchedulingEnabled: boolean
  peakHoursStart: string
  peakHoursEnd: string
  loadBalancingStrategy: string
  chargingPriorities: ChargingPriority[]
  queueManagementEnabled: boolean
  
  // Timeline
  timelineEvents: TimelineEvent[]
  
  // Chaos Testing
  chaosEnabled: boolean
  chaosStrategies: ChaosStrategy[]
}

export interface TimelineEvent {
  id: string
  at: number
  action: string
  description: string
  targets: string
  params: Record<string, any>
}

export interface ChaosStrategy {
  id: string
  name: string
  enabled: boolean
  startTime: number
  duration: number
  target: string
  params: Record<string, any>
}

export interface ChargingPriority {
  id: string
  name: string
  priority: number
  maxAmperage: number
  timeWindows: TimeWindow[]
  enabled: boolean
}

export interface TimeWindow {
  start: string
  end: string
  days: string[]
  maxAmperage?: number
}

export default function ScenarioBuilder({ onClose }: ScenarioBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [scenarioData, setScenarioData] = useState<ScenarioData>({
    // Default values optimized for CSMS load testing
    name: '',
    description: '',
    duration: 600, // 10 minutes
    tags: ['load-test', 'csms'],
    version: '1.0',
    
    chargerCount: 100,
    chargerModel: 'FastCharger',
    chargerVendor: 'TestCorp',
    connectors: 2,
    ocppVersion: '1.6',
    csmsEndpoint: 'ws://localhost:8080/ocpp',
    
    useLoadProfile: true,
    rampUpRate: 10, // chargers per second
    rampUpDuration: 60, // 1 minute
    steadyStateDuration: 480, // 8 minutes
    rampDownRate: 20, // faster shutdown
    rampDownDuration: 30, // 30 seconds
    
    // Power Management defaults
    powerManagementEnabled: false,
    siteMaxAmperage: 400, // 400A site capacity
    chargerMaxAmperage: 32, // 32A per charger max
    smartSchedulingEnabled: false,
    peakHoursStart: '17:00',
    peakHoursEnd: '21:00',
    loadBalancingStrategy: 'proportional',
    chargingPriorities: [],
    queueManagementEnabled: false,
    
    timelineEvents: [],
    
    chaosEnabled: false,
    chaosStrategies: [],
  })

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const renderCurrentStep = () => {
    switch (STEPS[currentStep].id) {
      case 'basic':
        return (
          <BasicInfoStep
            data={scenarioData}
            onUpdate={setScenarioData}
          />
        )
      case 'load':
        return (
          <LoadTestingStep
            data={scenarioData}
            onUpdate={setScenarioData}
          />
        )
      case 'power':
        return (
          <PowerManagementStep
            data={scenarioData}
            onUpdate={setScenarioData}
          />
        )
      case 'timeline':
        return (
          <TimelineStep
            data={scenarioData}
            onUpdate={setScenarioData}
          />
        )
      case 'chaos':
        return (
          <ChaosStep
            data={scenarioData}
            onUpdate={setScenarioData}
          />
        )
      case 'preview':
        return (
          <PreviewStep
            data={scenarioData}
            onClose={onClose}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Scenario</h1>
              <p className="text-sm text-gray-600">
                Build dynamic OCPP scenarios for CSMS load testing
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              Step {currentStep + 1} of {STEPS.length}
            </Badge>
            <Progress value={progress} className="w-32" />
          </div>
        </div>
      </div>

      <div className="flex h-full min-h-[calc(100vh-80px)]">
        {/* Sidebar - Steps Navigation */}
        <div className="w-80 bg-white border-r border-gray-200 p-6">
          <div className="space-y-1">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    currentStep === index
                      ? 'bg-blue-50 border-2 border-blue-200 text-blue-900'
                      : currentStep > index
                      ? 'bg-green-50 border border-green-200 text-green-900 hover:bg-green-100'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep === index
                        ? 'bg-blue-600 text-white'
                        : currentStep > index
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {currentStep > index ? '✓' : <StepIcon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{step.title}</div>
                      <div className="text-sm text-gray-500">{step.description}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* CSMS Load Testing Tips */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              CSMS Validation Tips
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Test CSMS SetChargingProfile responses</li>
              <li>• Validate OCPP 1.6J message compliance</li>
              <li>• Verify amperage limits in responses</li>
              <li>• Check load balancing algorithm accuracy</li>
              <li>• Test CSMS response timing (&lt; 30s)</li>
            </ul>
          </div>

          {/* Load Templates */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Quick Templates</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => {
                  setScenarioData(prev => ({
                    ...prev,
                    name: 'High Load CSMS Test',
                    description: 'Tests CSMS performance under heavy concurrent load',
                    chargerCount: 500,
                    duration: 900,
                    useLoadProfile: true,
                    chaosEnabled: true
                  }))
                  setCurrentStep(1)
                }}
              >
                🚀 High Load Test
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => {
                  setScenarioData(prev => ({
                    ...prev,
                    name: 'Connection Spike Test',
                    description: 'Tests CSMS handling of rapid connection spikes',
                    chargerCount: 1000,
                    rampUpRate: 50,
                    rampUpDuration: 20,
                    chaosEnabled: true
                  }))
                  setCurrentStep(1)
                }}
              >
                ⚡ Connection Spike
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => {
                  setScenarioData(prev => ({
                    ...prev,
                    name: 'CSMS Over-Capacity Test',
                    description: 'Test CSMS SetChargingProfile responses when demand exceeds capacity',
                    chargerCount: 20,
                    powerManagementEnabled: true,
                    siteMaxAmperage: 400,
                    chargerMaxAmperage: 32,
                    loadBalancingStrategy: 'proportional'
                  }))
                  setCurrentStep(2)
                }}
              >
                🔋 CSMS Over-Capacity
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => {
                  setScenarioData(prev => ({
                    ...prev,
                    name: 'CSMS Response Validation',
                    description: 'Validate CSMS OCPP 1.6J compliance and response timing',
                    chargerCount: 15,
                    powerManagementEnabled: true,
                    siteMaxAmperage: 300,
                    chargerMaxAmperage: 32,
                    loadBalancingStrategy: 'priority'
                  }))
                  setCurrentStep(2)
                }}
              >
                ✅ CSMS Validation
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => {
                  setScenarioData(prev => ({
                    ...prev,
                    name: 'Chaos Resilience Test',
                    description: 'Tests CSMS resilience under network failures',
                    chaosEnabled: true,
                    chaosStrategies: [
                      {
                        id: '1',
                        name: 'network_loss',
                        enabled: true,
                        startTime: 120,
                        duration: 60,
                        target: 'random_20_percent',
                        params: { reconnect: true }
                      }
                    ]
                  }))
                  setCurrentStep(4)
                }}
              >
                💥 Chaos Testing
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {renderCurrentStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < STEPS.length - 1 ? (
                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview YAML
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export Scenario
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

