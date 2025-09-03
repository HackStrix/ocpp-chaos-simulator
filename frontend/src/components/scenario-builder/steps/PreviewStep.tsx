'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Eye, Download, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import { ScenarioData } from '../ScenarioBuilder'

interface PreviewStepProps {
  data: ScenarioData
  onClose: () => void
}

export function PreviewStep({ data, onClose }: PreviewStepProps) {
  const [yamlContent, setYamlContent] = useState('')
  const [copied, setCopied] = useState(false)

  const generateYaml = () => {
    const yaml = `# Generated OCPP Chaos Simulator Scenario
name: "${data.name}"
description: "${data.description}"
version: "${data.version}"
duration: ${data.duration}
tags: ${JSON.stringify(data.tags)}

chargers:
  count: ${data.chargerCount}
  template:
    model: "${data.chargerModel}"
    vendor: "${data.chargerVendor}"
    connectors: ${data.connectors}
    ocpp_version: "${data.ocppVersion}"

csms:
  endpoint: "${data.csmsEndpoint}"
  protocol: "ocpp${data.ocppVersion}"

${data.powerManagementEnabled ? `# CSMS Load Balancing Validation
csms_validation:
  test_type: "load_balancing_compliance"
  site_max_amperage: ${data.siteMaxAmperage}
  expected_csms_strategy: "${data.loadBalancingStrategy}"
  
  # Power Request Scenario
  power_requests:
    per_charger_request: ${data.chargerMaxAmperage} # Amperage each charger requests
    total_demand: ${data.chargerCount * data.chargerMaxAmperage} # Total requested power
    expected_over_capacity: ${data.chargerCount * data.chargerMaxAmperage > data.siteMaxAmperage}
    
  # Expected CSMS Responses
  expected_csms_behavior:
    should_send_set_charging_profile: ${data.chargerCount * data.chargerMaxAmperage > data.siteMaxAmperage}
    should_reject_start_transaction: ${data.chargerCount * Math.min(data.chargerMaxAmperage, Math.floor(data.siteMaxAmperage / data.chargerCount)) >= data.siteMaxAmperage}
    expected_amperage_per_charger: ${Math.min(data.chargerMaxAmperage, Math.floor(data.siteMaxAmperage / data.chargerCount))}
    load_balancing_required: ${data.chargerCount * data.chargerMaxAmperage > data.siteMaxAmperage}
    
  # OCPP Message Validation Rules
  validation_rules:
    - message_type: "SetChargingProfile"
      validate: "chargingSchedule.chargingSchedulePeriod[0].limit <= expected_amperage_per_charger"
      required_when: "total_demand > site_max_amperage"
      
    - message_type: "StartTransactionResponse"  
      validate: "idTagInfo.status === 'Blocked' when no_power_available"
      required_when: "all_chargers_at_capacity"
      
    - message_type: "ChangeAvailabilityResponse"
      validate: "status === 'Accepted' for load_shedding"
      required_when: "emergency_load_reduction"

` : ''}${data.useLoadProfile ? `load_profile:
  ramp_up:
    chargers_per_second: ${data.rampUpRate}
    total_duration: ${data.rampUpDuration}
  steady_state:
    duration: ${data.steadyStateDuration}
  ramp_down:
    chargers_per_second: ${data.rampDownRate}
    total_duration: ${data.rampDownDuration}
` : ''}

timeline:
${data.timelineEvents.length === 0 ? `  - at: 0
    action: "create_chargers"
    params:
      count: ${data.chargerCount}
      prefix: "LOAD"
      
  - at: 5
    action: "start_flow"
    targets: "all"
    flow:
      - send: "BootNotification"
        params:
          charge_point_model: "${data.chargerModel}"
          charge_point_vendor: "${data.chargerVendor}"
        wait_for: "BootNotificationResponse"` : 
  data.timelineEvents.map(event => `  - at: ${event.at}
    action: "${event.action}"
    targets: "${event.targets}"
    ${event.description ? `# ${event.description}` : ''}
    ${Object.keys(event.params).length > 0 ? `params: ${JSON.stringify(event.params, null, 6).replace(/^/gm, '      ')}` : ''}`).join('\n')}

${data.chaosEnabled && data.chaosStrategies.length > 0 ? `
# Chaos Engineering Strategies
${data.chaosStrategies.filter(s => s.enabled).map(strategy => `  - at: ${strategy.startTime}
    action: "inject_chaos"
    strategy: "${strategy.name}"
    targets: "${strategy.target}"
    params:
      duration: ${strategy.duration}
      ${Object.entries(strategy.params).map(([key, value]) => `${key}: ${typeof value === 'string' ? `"${value}"` : value}`).join('\n      ')}`).join('\n')}` : ''}

expectations:
  csms_should:
    - respond_within_timeout: 30
    ${data.powerManagementEnabled ? '- send_set_charging_profile_when_over_capacity: true' : ''}
    ${data.powerManagementEnabled ? '- respect_site_amperage_limits: true' : ''}
    ${data.powerManagementEnabled ? '- implement_load_balancing_algorithm: true' : ''}
    ${data.chaosEnabled ? '- handle_chaos_gracefully: true' : ''}
    - maintain_ocpp_1_6j_compliance: true
    
  ${data.powerManagementEnabled ? `load_balancing_compliance:
    max_total_amperage: ${data.siteMaxAmperage}
    expected_per_charger_limit: ${Math.min(data.chargerMaxAmperage, Math.floor(data.siteMaxAmperage / data.chargerCount))}
    set_charging_profile_required: ${data.chargerCount * data.chargerMaxAmperage > data.siteMaxAmperage}
    load_balancing_strategy: "${data.loadBalancingStrategy}"
    
  ` : ''}performance:
    max_response_time: 5000
    max_memory_usage: "4GB"
    min_success_rate: ${data.chaosEnabled ? '95.0' : '99.5'}
    max_concurrent_connections: ${data.chargerCount}

results:
  format: ["json", "csv", "performance_report"]
  include:
    - connection_timeline
    - message_throughput
    - error_breakdown
    - load_balancer_stats
    ${data.chaosEnabled ? '- chaos_injection_results' : ''}
`
    
    setYamlContent(yaml)
    return yaml
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(yamlContent || generateYaml())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadYaml = () => {
    const yaml = yamlContent || generateYaml()
    const blob = new Blob([yaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.yaml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const validateScenario = () => {
    const issues: string[] = []
    if (!data.name.trim()) issues.push('Scenario name is required')
    if (data.chargerCount <= 0) issues.push('Charger count must be greater than 0')
    if (data.duration <= 0) issues.push('Duration must be greater than 0')
    if (!data.csmsEndpoint.trim()) issues.push('CSMS endpoint is required')
    
    return issues
  }

  const validationIssues = validateScenario()
  const isValid = validationIssues.length === 0

  return (
    <div className="space-y-6">
      {/* Scenario Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <span>Scenario Preview</span>
          </CardTitle>
          <p className="text-gray-600">Review your CSMS load testing scenario before export</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Basic Info</h4>
              <div className="text-sm space-y-1">
                <div><strong>Name:</strong> {data.name || 'Unnamed Scenario'}</div>
                <div><strong>Duration:</strong> {Math.floor(data.duration / 60)}m {data.duration % 60}s</div>
                <div><strong>Version:</strong> {data.version}</div>
                <div><strong>Tags:</strong> {data.tags.join(', ')}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Load Configuration</h4>
              <div className="text-sm space-y-1">
                <div><strong>Chargers:</strong> {data.chargerCount}</div>
                <div><strong>Connectors:</strong> {data.chargerCount * data.connectors} total</div>
                <div><strong>OCPP:</strong> {data.ocppVersion}</div>
                <div><strong>Load Profile:</strong> {data.useLoadProfile ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Power Management</h4>
              <div className="text-sm space-y-1">
                <div><strong>Enabled:</strong> {data.powerManagementEnabled ? 'Yes' : 'No'}</div>
                {data.powerManagementEnabled && (
                  <>
                    <div><strong>Site Capacity:</strong> {data.siteMaxAmperage}A</div>
                    <div><strong>Max Per Charger:</strong> {data.chargerMaxAmperage}A</div>
                    <div><strong>Total Demand:</strong> {data.chargerCount * data.chargerMaxAmperage}A</div>
                    <div><strong>Smart Scheduling:</strong> {data.smartSchedulingEnabled ? 'Enabled' : 'Disabled'}</div>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Chaos Testing</h4>
              <div className="text-sm space-y-1">
                <div><strong>Enabled:</strong> {data.chaosEnabled ? 'Yes' : 'No'}</div>
                <div><strong>Strategies:</strong> {data.chaosStrategies.filter(s => s.enabled).length}</div>
                <div><strong>Timeline Events:</strong> {data.timelineEvents.length}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation */}
      {validationIssues.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-medium text-red-900">Validation Issues</h3>
            </div>
            <ul className="text-sm text-red-800 space-y-1">
              {validationIssues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* YAML Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated YAML Scenario</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center space-x-2"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </Button>
              <Button
                onClick={downloadYaml}
                disabled={!isValid}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download YAML
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={yamlContent || generateYaml()}
            onChange={(e) => setYamlContent(e.target.value)}
            className="font-mono text-sm h-96"
            placeholder="Generated YAML will appear here..."
          />
        </CardContent>
      </Card>

      {/* Final Actions */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={onClose}>
          Close Builder
        </Button>
        <Button
          onClick={downloadYaml}
          disabled={!isValid}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export & Save Scenario
        </Button>
      </div>
    </div>
  )
}

