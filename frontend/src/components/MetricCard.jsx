import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const MetricCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  status, 
  description, 
  target, 
  trend,
  previousValue 
}) => {
  const getStatusStyles = () => {
    const baseStyles = "rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md bg-white dark:bg-gray-800"
    
    switch (status.color) {
      case 'green':
        return `${baseStyles} border-green-200 dark:border-green-700/50`
      case 'blue':
        return `${baseStyles} border-blue-200 dark:border-blue-700/50`
      case 'yellow':
        return `${baseStyles} border-yellow-200 dark:border-yellow-700/50`
      case 'red':
        return `${baseStyles} border-red-200 dark:border-red-700/50`
      default:
        return `${baseStyles} border-gray-200 dark:border-gray-700`
    }
  }

  const getIconStyles = () => {
    const baseStyles = "w-10 h-10 rounded-lg flex items-center justify-center"
    
    switch (status.color) {
      case 'green':
        return `${baseStyles} bg-green-500 text-white`
      case 'blue':
        return `${baseStyles} bg-blue-500 text-white`
      case 'yellow':
        return `${baseStyles} bg-yellow-500 text-white`
      case 'red':
        return `${baseStyles} bg-red-500 text-white`
      default:
        return `${baseStyles} bg-gray-500 text-white`
    }
  }

  const getStatusBadge = () => {
    const baseStyles = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
    
    switch (status.status) {
      case 'excellent':
        return (
          <span className={`${baseStyles} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>
            Excellent
          </span>
        )
      case 'good':
        return (
          <span className={`${baseStyles} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`}>
            Good
          </span>
        )
      case 'warning':
        return (
          <span className={`${baseStyles} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`}>
            Warning
          </span>
        )
      case 'critical':
        return (
          <span className={`${baseStyles} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>
            Critical
          </span>
        )
      default:
        return (
          <span className={`${baseStyles} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`}>
            Unknown
          </span>
        )
    }
  }

  const getTrendIndicator = () => {
    if (!previousValue || previousValue === value) return null
    
    const isPositive = value > previousValue
    const percentChange = Math.abs(((value - previousValue) / previousValue) * 100)
    
    return (
      <div className={`flex items-center text-xs ${
        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}>
        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span className="ml-1">{percentChange.toFixed(1)}%</span>
      </div>
    )
  }

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val % 1 === 0 ? val.toString() : val.toFixed(2)
    }
    return val
  }

  return (
    <div className={`${getStatusStyles()} h-full min-h-[240px] flex flex-col overflow-hidden`}>
      <div className="p-6 flex-1 flex flex-col">
        {/* Header with Icon and Status */}
        <div className="flex items-start justify-between mb-6">
          <div className={getIconStyles()}>
            <Icon size={20} />
          </div>
          {getStatusBadge()}
        </div>

        {/* Main Value Section - Centered and Prominent */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="mb-2">
            <div className="flex items-baseline justify-center">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {formatValue(value)}
              </span>
              {unit && (
                <span className="text-lg font-medium text-gray-500 dark:text-gray-400 ml-2">
                  {unit}
                </span>
              )}
            </div>
          </div>
          
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {title}
          </h3>
          
          {/* Change Indicator */}
          <div className="flex items-center justify-center">
            {getTrendIndicator()}
          </div>
        </div>

        {/* Bottom Description */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {description}
            </p>
          )}
          {target && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-500">Target:</span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{target}</span>
            </div>
          )}
        </div>

        {/* Progress Bar for percentage values */}
        {unit === '%' && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  status.color === 'green' ? 'bg-green-500' :
                  status.color === 'blue' ? 'bg-blue-500' :
                  status.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(value, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MetricCard 