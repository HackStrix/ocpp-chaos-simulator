'use client'

import { useState, useEffect } from 'react'
import { VirtualCharger, Scenario } from '@/types/ocpp'
import { RealTimeEvent } from '@/types/events'
import ChargerGrid from '@/components/ChargerGrid'
import EventLog from '@/components/EventLog'
import ScenarioControls from '@/components/ScenarioControls'
import SystemStats from '@/components/SystemStats'

// Mock data for development (will be replaced with API calls)
const mockChargers: VirtualCharger[] = [
  {
    id: 'CP001',
    config: {
      identifier: 'CP001',
      model: 'TestCharger',
      vendor: 'TestVendor',
      serial_number: 'SN123456',
      connector_count: 2,
      features: ['Core'],
      csms_endpoint: 'ws://localhost:8080/ocpp',
      ocpp_version: '1.6',
    },
    status: 'connected',
    connectors: [
      { id: 1, status: 'Available' },
      { id: 2, status: 'Charging' },
    ],
    transactions: [
      {
        id: 1,
        connector_id: 2,
        id_tag: 'USER123',
        start_time: new Date().toISOString(),
        meter_start: 1000,
        status: 'active',
      },
    ],
    connected: true,
    last_heartbeat: new Date().toISOString(),
  },
  {
    id: 'CP002',
    config: {
      identifier: 'CP002',
      model: 'TestCharger',
      vendor: 'TestVendor',
      serial_number: 'SN123457',
      connector_count: 1,
      features: ['Core'],
      csms_endpoint: 'ws://localhost:8080/ocpp',
      ocpp_version: '1.6',
    },
    status: 'offline',
    connectors: [
      { id: 1, status: 'Unavailable' },
    ],
    transactions: [],
    connected: false,
  },
]

const mockScenarios: Scenario[] = [
  {
    name: 'Basic Auth Test',
    description: 'Test scenario with basic authentication for CSMS connection',
    version: '1.0',
    duration: 60,
    tags: ['auth', 'basic', 'test'],
    chargers: {
      count: 2,
      template: {
        model: 'AuthTestCharger',
        vendor: 'TestCorp',
        connectors: 1,
        ocpp_version: '1.6',
      },
    },
    csms: {
      endpoint: 'ws://localhost:8080/ocpp',
      protocol: 'ocpp1.6',
      basic_auth_user: 'admin',
      basic_auth_pass: 'password123',
    },
    timeline: [],
  },
]

export default function Dashboard() {
  const [chargers, setChargers] = useState<VirtualCharger[]>(mockChargers)
  const [scenarios, setScenarios] = useState<Scenario[]>(mockScenarios)
  const [events, setEvents] = useState<RealTimeEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // WebSocket connection (placeholder for now)
  useEffect(() => {
    // Simulate connection status
    setIsConnected(true)
    
    // Simulate some events
    const mockEvents: RealTimeEvent[] = [
      {
        type: 'charger.boot_notification.sent',
        data: {
          charger_id: 'CP001',
          model: 'TestCharger',
          vendor: 'TestVendor',
        },
        timestamp: Date.now() - 60000,
      },
      {
        type: 'charger.transaction.started',
        data: {
          charger_id: 'CP001',
          transaction_id: 1,
          connector_id: 2,
          id_tag: 'USER123',
        },
        timestamp: Date.now() - 30000,
      },
    ]
    
    setEvents(mockEvents)
  }, [])

  const handleRunScenario = (scenario: Scenario) => {
    console.log('Running scenario:', scenario.name)
    // TODO: Implement API call to run scenario
    
    // Simulate scenario start event
    const event: RealTimeEvent = {
      type: 'simulation.started',
      data: {
        simulation_id: Date.now(),
        name: scenario.name,
      },
      timestamp: Date.now(),
    }
    
    setEvents(prev => [event, ...prev])
  }

  const handleStopScenario = (scenarioName: string) => {
    console.log('Stopping scenario:', scenarioName)
    // TODO: Implement API call to stop scenario
  }

  const stats = {
    totalChargers: chargers.length,
    connectedChargers: chargers.filter(c => c.connected).length,
    activeTransactions: chargers.reduce((total, charger) => 
      total + charger.transactions.filter(t => t.status === 'active').length, 0
    ),
    totalEvents: events.length,
  }

  return (
    <div className="space-y-6">
      {/* System Stats */}
      <SystemStats stats={stats} isConnected={isConnected} />
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charger Grid - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <ChargerGrid chargers={chargers} />
        </div>
        
        {/* Scenario Controls - Takes up 1 column */}
        <div className="space-y-6">
          <ScenarioControls
            scenarios={scenarios}
            onRunScenario={handleRunScenario}
            onStopScenario={handleStopScenario}
          />
        </div>
      </div>
      
      {/* Event Log - Full width */}
      <EventLog events={events} />
    </div>
  )
}
