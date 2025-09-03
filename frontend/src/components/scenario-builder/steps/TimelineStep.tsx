'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Clock, MessageSquare, Play, AlertCircle } from 'lucide-react'
import { ScenarioData, TimelineEvent } from '../ScenarioBuilder'

interface TimelineStepProps {
  data: ScenarioData
  onUpdate: (data: ScenarioData) => void
}

const TIMELINE_TEMPLATES = [
  {
    id: 'boot-sequence',
    name: 'Boot Sequence',
    description: 'Standard charger boot notification flow',
    events: [
      {
        at: 0,
        action: 'create_chargers',
        description: 'Create virtual chargers',
        targets: 'all',
        params: { prefix: 'LOAD' }
      },
      {
        at: 5,
        action: 'start_flow',
        description: 'Boot notification sequence',
        targets: 'all',
        params: { flow: 'boot_notification' }
      }
    ]
  },
  {
    id: 'charging-cycle',
    name: 'Charging Cycle',
    description: 'Complete charging transaction flow',
    events: [
      {
        at: 30,
        action: 'start_flow',
        description: 'Start charging transactions',
        targets: 'all',
        params: { flow: 'charging_session' }
      }
    ]
  },
  {
    id: 'heartbeat-flood',
    name: 'Heartbeat Flood',
    description: 'High-frequency heartbeat testing',
    events: [
      {
        at: 60,
        action: 'start_flow',
        description: 'Rapid heartbeat messages',
        targets: 'all',
        params: { flow: 'rapid_heartbeat', interval: 1 }
      }
    ]
  }
]

export function TimelineStep({ data, onUpdate }: TimelineStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('')

  const updateField = (field: keyof ScenarioData, value: any) => {
    onUpdate({ ...data, [field]: value })
  }

  const addEvent = () => {
    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      at: 0,
      action: 'start_flow',
      description: '',
      targets: 'all',
      params: {}
    }
    updateField('timelineEvents', [...data.timelineEvents, newEvent])
  }

  const updateEvent = (id: string, updates: Partial<TimelineEvent>) => {
    const updatedEvents = data.timelineEvents.map(event =>
      event.id === id ? { ...event, ...updates } : event
    )
    updateField('timelineEvents', updatedEvents)
  }

  const removeEvent = (id: string) => {
    updateField('timelineEvents', data.timelineEvents.filter(e => e.id !== id))
  }

  const applyTemplate = () => {
    const template = TIMELINE_TEMPLATES.find(t => t.id === selectedTemplate)
    if (template) {
      const templateEvents: TimelineEvent[] = template.events.map((event, index) => ({
        ...event,
        id: `${Date.now()}-${index}`,
      }))
      updateField('timelineEvents', [...data.timelineEvents, ...templateEvents])
      setSelectedTemplate('')
    }
  }

  const sortedEvents = [...data.timelineEvents].sort((a, b) => a.at - b.at)

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Timeline Builder</span>
          </CardTitle>
          <p className="text-gray-600">Define when events occur during your CSMS load test</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <Select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">Choose a template...</option>
              {TIMELINE_TEMPLATES.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </Select>
            <Button 
              onClick={applyTemplate} 
              disabled={!selectedTemplate}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
            <Button onClick={addEvent} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Custom Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Events */}
      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Events</h3>
              <p className="text-gray-500 mb-4">Add events to define what happens during your CSMS load test</p>
              <div className="flex justify-center space-x-2">
                <Button onClick={addEvent} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Event
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedEvents.map((event, index) => (
            <Card key={event.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      T+{event.at}s
                    </Badge>
                    <CardTitle className="text-lg">{event.action.replace('_', ' ')}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEvent(event.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Time (seconds)</Label>
                    <Input
                      type="number"
                      value={event.at}
                      onChange={(e) => updateEvent(event.id, { at: parseInt(e.target.value) || 0 })}
                      min="0"
                      max={data.duration}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Action Type</Label>
                    <Select
                      value={event.action}
                      onChange={(e) => updateEvent(event.id, { action: e.target.value })}
                    >
                      <option value="create_chargers">Create Chargers</option>
                      <option value="start_flow">Start Flow</option>
                      <option value="inject_chaos">Inject Chaos</option>
                      <option value="start_monitoring">Start Monitoring</option>
                      <option value="stop_flow">Stop Flow</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Targets</Label>
                    <Select
                      value={event.targets}
                      onChange={(e) => updateEvent(event.id, { targets: e.target.value })}
                    >
                      <option value="all">All Chargers</option>
                      <option value="random_10_percent">Random 10%</option>
                      <option value="random_25_percent">Random 25%</option>
                      <option value="random_50_percent">Random 50%</option>
                      <option value="first_half">First Half</option>
                      <option value="second_half">Second Half</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={event.description}
                    onChange={(e) => updateEvent(event.id, { description: e.target.value })}
                    placeholder="Describe what this event does..."
                  />
                </div>

                {/* Action-specific parameters */}
                {event.action === 'start_flow' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Message Flow Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Flow Type</Label>
                        <Select
                          value={event.params.flow || ''}
                          onChange={(e) => updateEvent(event.id, { 
                            params: { ...event.params, flow: e.target.value }
                          })}
                        >
                          <option value="">Select flow...</option>
                          <option value="boot_notification">Boot Notification</option>
                          <option value="charging_session">Charging Session</option>
                          <option value="heartbeat_sequence">Heartbeat Sequence</option>
                          <option value="meter_values">Meter Values</option>
                          <option value="status_updates">Status Updates</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Interval (seconds)</Label>
                        <Input
                          type="number"
                          value={event.params.interval || ''}
                          onChange={(e) => updateEvent(event.id, { 
                            params: { ...event.params, interval: parseInt(e.target.value) || 1 }
                          })}
                          placeholder="5"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* CSMS Timeline Recommendations */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <h3 className="font-medium text-green-900 mb-2">🎯 CSMS Load Testing Timeline Tips</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• <strong>0-60s:</strong> Gradual charger creation and boot notifications</li>
            <li>• <strong>60-300s:</strong> Start charging transactions across all chargers</li>
            <li>• <strong>300-450s:</strong> Inject chaos to test resilience</li>
            <li>• <strong>450-600s:</strong> Normal operation and cleanup</li>
            <li>• <strong>Monitor:</strong> Connection spikes, message throughput, error rates</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
