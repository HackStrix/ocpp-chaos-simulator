'use client'

import { useState, useMemo } from 'react'
import { RealTimeEvent, EventFilter, ChargerEvent, OCPPMessageEvent } from '@/types/events'
import { getEventLevelColor, getEventTypeDisplayName, formatTimestamp } from '@/lib/utils'
import { Filter, Search, X, AlertTriangle, Info, AlertCircle } from 'lucide-react'

interface EventLogProps {
  events: RealTimeEvent[]
}

export default function EventLog({ events }: EventLogProps) {
  const [filter, setFilter] = useState<EventFilter>({
    types: [],
    chargers: [],
    levels: [],
    search: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Get unique values for filter options
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(events.map(e => e.type))), [events]
  )
  
  const uniqueChargers = useMemo(() => 
    Array.from(new Set(events
      .filter((e): e is RealTimeEvent & { data: { charger_id: string } } => 'charger_id' in e.data)
      .map(e => e.data.charger_id)
    )), [events]
  )

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Type filter
      if (filter.types.length > 0 && !filter.types.includes(event.type)) {
        return false
      }
      
      // Charger filter
      if (filter.chargers.length > 0 && 'charger_id' in event.data && 
          !filter.chargers.includes(event.data.charger_id)) {
        return false
      }
      
      // Search filter
      if (filter.search) {
        const searchLower = filter.search.toLowerCase()
        const eventText = `${event.type} ${JSON.stringify(event.data)}`.toLowerCase()
        if (!eventText.includes(searchLower)) {
          return false
        }
      }
      
      return true
    })
  }, [events, filter])

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('error') || eventType.includes('chaos')) {
      return <AlertTriangle className="h-4 w-4" />
    } else if (eventType.includes('warning')) {
      return <AlertCircle className="h-4 w-4" />
    } else {
      return <Info className="h-4 w-4" />
    }
  }

  const getEventLevel = (eventType: string): 'info' | 'warning' | 'error' | 'debug' => {
    if (eventType.includes('error') || eventType.includes('failed')) {
      return 'error'
    } else if (eventType.includes('chaos') || eventType.includes('stopped')) {
      return 'warning'
    } else {
      return 'info'
    }
  }

  const clearFilters = () => {
    setFilter({
      types: [],
      chargers: [],
      levels: [],
      search: '',
    })
  }

  const toggleFilter = (filterType: keyof Pick<EventFilter, 'types' | 'chargers' | 'levels'>, value: string) => {
    setFilter(prev => {
      const currentArray = prev[filterType]
      return {
        ...prev,
        [filterType]: currentArray.includes(value as never)
          ? currentArray.filter((item: string) => item !== value)
          : [...currentArray, value]
      }
    })
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Event Log</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {filteredEvents.length} of {events.length} events
            </span>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md ${showFilters ? 'bg-primary-100 text-primary-700' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="space-y-3">
            {/* Event Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Types</label>
              <div className="flex flex-wrap gap-1">
                {uniqueTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleFilter('types', type)}
                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      filter.types.includes(type)
                        ? 'bg-primary-100 text-primary-800 border-primary-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    } border`}
                  >
                    {getEventTypeDisplayName(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Chargers */}
            {uniqueChargers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chargers</label>
                <div className="flex flex-wrap gap-1">
                  {uniqueChargers.map((chargerId) => (
                    <button
                      key={chargerId}
                      onClick={() => toggleFilter('chargers', chargerId)}
                      className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                        filter.chargers.includes(chargerId)
                          ? 'bg-primary-100 text-primary-800 border-primary-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      } border`}
                    >
                      {chargerId}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {(filter.types.length > 0 || filter.chargers.length > 0 || filter.search) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <X className="h-3 w-3" />
                <span>Clear filters</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Event List */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {filteredEvents.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-400">
              <Info className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">No events to display</p>
              {filter.search || filter.types.length > 0 || filter.chargers.length > 0 ? (
                <p className="text-xs text-gray-500 mt-1">Try adjusting your filters</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Events will appear here as they occur</p>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {filteredEvents.slice(0, 100).map((event, index) => {
              const level = getEventLevel(event.type)
              return (
                <div key={`${event.timestamp}-${index}`} className="px-6 py-3 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 ${getEventLevelColor(level)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {getEventTypeDisplayName(event.type)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(event.timestamp)}
                        </p>
                      </div>
                      <div className="mt-1">
                        {'charger_id' in event.data && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mr-2">
                            {event.data.charger_id}
                          </span>
                        )}
                        <pre className="inline text-xs text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(event.data, null, 0)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {filteredEvents.length > 100 && (
              <div className="px-6 py-3 text-center text-sm text-gray-500">
                Showing latest 100 events of {filteredEvents.length}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
