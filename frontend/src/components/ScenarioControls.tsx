'use client'

import { useState } from 'react'
import { Scenario } from '@/types/ocpp'
import { Play, Square, FileText, Clock, Users, Tag } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

interface ScenarioControlsProps {
  scenarios: Scenario[]
  onRunScenario: (scenario: Scenario) => void
  onStopScenario: (scenarioName: string) => void
}

export default function ScenarioControls({ scenarios, onRunScenario, onStopScenario }: ScenarioControlsProps) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(scenarios[0] || null)
  const [runningScenarios, setRunningScenarios] = useState<Set<string>>(new Set())

  const handleRunScenario = () => {
    if (selectedScenario) {
      onRunScenario(selectedScenario)
      setRunningScenarios(prev => new Set(prev).add(selectedScenario.name))
    }
  }

  const handleStopScenario = (scenarioName: string) => {
    onStopScenario(scenarioName)
    setRunningScenarios(prev => {
      const newSet = new Set(prev)
      newSet.delete(scenarioName)
      return newSet
    })
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Scenario Controls</h2>
      
      {/* Scenario Selection */}
      <div className="mb-4">
        <label htmlFor="scenario-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Scenario
        </label>
        <select
          id="scenario-select"
          value={selectedScenario?.name || ''}
          onChange={(e) => {
            const scenario = scenarios.find(s => s.name === e.target.value) || null
            setSelectedScenario(scenario)
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">Select a scenario...</option>
          {scenarios.map((scenario) => (
            <option key={scenario.name} value={scenario.name}>
              {scenario.name}
            </option>
          ))}
        </select>
      </div>

      {/* Scenario Details */}
      {selectedScenario && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-2 mb-2">
            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{selectedScenario.name}</p>
              <p className="text-sm text-gray-600">{selectedScenario.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(selectedScenario.duration)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{selectedScenario.chargers.count} charger{selectedScenario.chargers.count !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {selectedScenario.tags.length > 0 && (
            <div className="mt-2 flex items-center space-x-1">
              <Tag className="h-3 w-3 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {selectedScenario.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleRunScenario}
          disabled={!selectedScenario || runningScenarios.has(selectedScenario?.name || '')}
          className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          <Play className="h-4 w-4" />
          <span>
            {selectedScenario && runningScenarios.has(selectedScenario.name) ? 'Running...' : 'Run Scenario'}
          </span>
        </button>

        {selectedScenario && runningScenarios.has(selectedScenario.name) && (
          <button
            onClick={() => handleStopScenario(selectedScenario.name)}
            className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            <Square className="h-4 w-4" />
            <span>Stop Scenario</span>
          </button>
        )}
      </div>

      {/* Running Scenarios List */}
      {runningScenarios.size > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Running Scenarios</h3>
          <div className="space-y-1">
            {Array.from(runningScenarios).map((scenarioName) => (
              <div key={scenarioName} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">{scenarioName}</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <button
                    onClick={() => handleStopScenario(scenarioName)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Square className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
