'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { ScenarioData } from '../ScenarioBuilder'

interface BasicInfoStepProps {
  data: ScenarioData
  onUpdate: (data: ScenarioData) => void
}

export function BasicInfoStep({ data, onUpdate }: BasicInfoStepProps) {
  const updateField = (field: keyof ScenarioData, value: any) => {
    onUpdate({ ...data, [field]: value })
  }

  const addTag = (tag: string) => {
    if (tag.trim() && !data.tags.includes(tag.trim())) {
      updateField('tags', [...data.tags, tag.trim()])
    }
  }

  const removeTag = (tag: string) => {
    updateField('tags', data.tags.filter(t => t !== tag))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-gray-900">Basic Scenario Information</CardTitle>
        <p className="text-gray-600">Define the core properties of your CSMS load testing scenario</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Scenario Name *</Label>
          <Input
            id="name"
            placeholder="e.g., High Load CSMS Test"
            value={data.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="text-base"
          />
          <p className="text-sm text-gray-500">Choose a descriptive name for your load testing scenario</p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what this scenario tests, e.g., 'Tests CSMS performance under heavy concurrent load with gradual ramp-up'"
            value={data.description}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
          />
        </div>

        {/* Duration and Version */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (seconds) *</Label>
            <Input
              id="duration"
              type="number"
              placeholder="600"
              value={data.duration}
              onChange={(e) => updateField('duration', parseInt(e.target.value) || 0)}
              min="1"
              max="3600"
            />
            <p className="text-sm text-gray-500">
              {data.duration ? `${Math.floor(data.duration / 60)}m ${data.duration % 60}s` : 'Total test duration'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              placeholder="1.0"
              value={data.version}
              onChange={(e) => updateField('version', e.target.value)}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {data.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                <span>{tag}</span>
                <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex space-x-2">
            <Input
              placeholder="Add tag (e.g., load-test, chaos, performance)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addTag(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500">Press Enter to add tags. Common tags: load-test, chaos, performance, csms</p>
        </div>

        {/* Quick Template Suggestions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 CSMS Load Testing Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateField('name', 'CSMS Peak Load Test')
                updateField('description', 'Tests CSMS performance under peak concurrent load')
                updateField('duration', 900)
                updateField('tags', ['load-test', 'peak-load', 'csms', 'performance'])
              }}
            >
              Peak Load Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateField('name', 'Connection Spike Resilience')
                updateField('description', 'Tests CSMS handling of rapid connection spikes')
                updateField('duration', 300)
                updateField('tags', ['connection-spike', 'resilience', 'csms'])
              }}
            >
              Connection Spike
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateField('name', 'Transaction Recovery Test')
                updateField('description', 'Tests transaction state recovery after failures')
                updateField('duration', 600)
                updateField('tags', ['transaction', 'recovery', 'resilience'])
              }}
            >
              Transaction Recovery
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}