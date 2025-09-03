'use client'

import { ReactNode } from 'react'

interface SimpleBarChartProps {
  data: { name: string; value: number; color?: string }[]
  maxValue?: number
}

export function SimpleBarChart({ data, maxValue }: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value))
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm text-gray-600 truncate">
            {item.name}
          </div>
          <div className="flex-1 flex items-center space-x-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${item.color || 'bg-blue-500'}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <div className="w-12 text-sm font-medium text-right">
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface SimplePieChartProps {
  data: { name: string; value: number; color?: string }[]
}

export function SimplePieChart({ data }: SimplePieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div 
              className={`h-3 w-3 rounded-full ${item.color || 'bg-blue-500'}`} 
            />
            <span className="text-sm font-medium">{item.name}</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold">{item.value}</span>
            <span className="text-xs text-gray-500 ml-1">
              ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
