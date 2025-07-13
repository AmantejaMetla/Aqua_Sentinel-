import React from 'react'
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react'

const AlertPanel = ({ alerts, onDismiss }) => {
  if (!alerts || alerts.length === 0) return null

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle size={20} />
      case 'high':
        return <AlertTriangle size={20} />
      case 'warning':
      case 'medium':
        return <AlertTriangle size={20} />
      case 'info':
      case 'low':
        return <Info size={20} />
      case 'success':
        return <CheckCircle size={20} />
      default:
        return <Info size={20} />
    }
  }

  const getAlertStyles = (severity) => {
    const baseStyles = "border-l-4 rounded-r-lg shadow-sm"
    
    switch (severity) {
      case 'critical':
        return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200`
      case 'high':
        return `${baseStyles} bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-200`
      case 'warning':
      case 'medium':
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 text-yellow-800 dark:text-yellow-200`
      case 'info':
      case 'low':
        return `${baseStyles} bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-200`
      case 'success':
        return `${baseStyles} bg-green-50 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-200`
      default:
        return `${baseStyles} bg-gray-50 dark:bg-gray-900/20 border-gray-400 text-gray-800 dark:text-gray-200`
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🚨 Active Alerts ({alerts.length})
        </h3>
        <button
          onClick={() => onDismiss && onDismiss('all')}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Dismiss All
        </button>
      </div>
      
      <div className="space-y-2">
        {alerts.map((alert, index) => (
          <div key={alert.id || index} className={getAlertStyles(alert.severity)}>
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium capitalize">
                        {alert.type?.replace('_', ' ') || 'System Alert'}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-50">
                        {alert.severity?.toUpperCase() || 'INFO'}
                      </span>
                    </div>
                    <p className="text-sm mt-1 pr-4">
                      {alert.message}
                    </p>
                    <p className="text-xs opacity-75 mt-2">
                      {formatTimestamp(alert.timestamp)}
                    </p>
                  </div>
                </div>
                
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(alert.id || index)}
                    className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Action buttons for critical alerts */}
              {alert.severity === 'critical' && (
                <div className="mt-3 flex space-x-2">
                  <button className="px-3 py-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded text-xs font-medium transition-colors">
                    View Details
                  </button>
                  <button className="px-3 py-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded text-xs font-medium transition-colors">
                    Take Action
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Alert Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-sm font-bold text-red-600 dark:text-red-400">
              {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Critical</div>
          </div>
          <div>
            <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
              {alerts.filter(a => a.severity === 'warning' || a.severity === 'medium').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Warning</div>
          </div>
          <div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {alerts.filter(a => a.severity === 'info' || a.severity === 'low').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Info</div>
          </div>
          <div>
            <div className="text-sm font-bold text-green-600 dark:text-green-400">
              {alerts.filter(a => a.severity === 'success').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Success</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertPanel 