import React from 'react'
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Filter, 
  Droplets, 
  Zap,
  Wifi,
  WifiOff,
  Server
} from 'lucide-react'
import { useWebSocket } from '../contexts/WebSocketContext'

const SystemStatus = ({ mlAnalysis }) => {
  const { connected, alerts } = useWebSocket()

  const getFilterStatus = () => {
    if (!mlAnalysis?.filter_analysis) {
      return { status: 'unknown', color: 'gray', message: 'Analyzing...' }
    }

    const saturation = mlAnalysis.filter_analysis.saturation_percent
    const days = mlAnalysis.filter_analysis.days_until_replacement

    if (saturation >= 80) {
      return { status: 'critical', color: 'red', message: 'Replacement needed' }
    } else if (saturation >= 60) {
      return { status: 'warning', color: 'yellow', message: `${days} days remaining` }
    } else {
      return { status: 'good', color: 'green', message: `${days} days remaining` }
    }
  }

  const getQualityStatus = () => {
    if (!mlAnalysis?.optimization) {
      return { status: 'unknown', color: 'gray', message: 'Analyzing...' }
    }

    const score = mlAnalysis.optimization.quality_score
    if (score >= 90) {
      return { status: 'excellent', color: 'green', message: 'Excellent quality' }
    } else if (score >= 70) {
      return { status: 'good', color: 'blue', message: 'Good quality' }
    } else if (score >= 50) {
      return { status: 'warning', color: 'yellow', message: 'Needs attention' }
    } else {
      return { status: 'critical', color: 'red', message: 'Critical issues' }
    }
  }

  const StatusIndicator = ({ status, children }) => {
    const getStyles = () => {
      switch (status.color) {
        case 'green':
          return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        case 'blue':
          return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        case 'yellow':
          return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
        case 'red':
          return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        default:
          return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200'
      }
    }

    const getIcon = () => {
      switch (status.status) {
        case 'excellent':
        case 'good':
          return <CheckCircle size={16} />
        case 'warning':
          return <AlertTriangle size={16} />
        case 'critical':
          return <AlertTriangle size={16} />
        default:
          return <Clock size={16} />
      }
    }

    return (
      <div className={`p-3 rounded-lg border ${getStyles()}`}>
        <div className="flex items-center space-x-2 mb-2">
          {getIcon()}
          <span className="font-medium text-sm">{children}</span>
        </div>
        <p className="text-xs opacity-80">{status.message}</p>
      </div>
    )
  }

  const filterStatus = getFilterStatus()
  const qualityStatus = getQualityStatus()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
          <Server size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Status
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time system health
          </p>
        </div>
      </div>

      {/* Status Grid */}
      <div className="space-y-4">
        {/* Connection Status */}
        <StatusIndicator 
          status={{ 
            status: connected ? 'good' : 'critical', 
            color: connected ? 'green' : 'red',
            message: connected ? 'Real-time data streaming' : 'Connection lost'
          }}
        >
          <div className="flex items-center space-x-2">
            {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>Connection</span>
          </div>
        </StatusIndicator>

        {/* Filter Status */}
        <StatusIndicator status={filterStatus}>
          <div className="flex items-center space-x-2">
            <Filter size={16} />
            <span>Filter Status</span>
          </div>
        </StatusIndicator>

        {/* Water Quality */}
        <StatusIndicator status={qualityStatus}>
          <div className="flex items-center space-x-2">
            <Droplets size={16} />
            <span>Water Quality</span>
          </div>
        </StatusIndicator>

        {/* System Power */}
        <StatusIndicator 
          status={{ 
            status: 'good', 
            color: 'green',
            message: 'All systems operational'
          }}
        >
          <div className="flex items-center space-x-2">
            <Zap size={16} />
            <span>System Power</span>
          </div>
        </StatusIndicator>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Recent Alerts ({alerts.length})
          </h4>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex items-start space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle size={14} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 truncate">
                    {alert.message}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Quick Stats
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {mlAnalysis?.optimization?.quality_score || '--'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Quality Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {mlAnalysis?.filter_analysis ? 
                Math.round(mlAnalysis.filter_analysis.days_until_replacement) : '--'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Days to Service</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemStatus 