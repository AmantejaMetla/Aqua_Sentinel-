import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApi } from '../contexts/ApiContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Zap, 
  Droplets, 
  Thermometer,
  Settings,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Power,
  Gauge,
  Clock,
  Shield,
  Target,
  TrendingUp,
  TrendingDown,
  Eye,
  Server,
  Database,
  Radio,
  Wrench
} from 'lucide-react'

const SystemMonitor = () => {
  const { getCurrentReading, executeControl, loading } = useApi()
  const { sensorData, alerts, connected, refreshData } = useWebSocket()
  
  const [currentData, setCurrentData] = useState(null)
  const [systemStatus, setSystemStatus] = useState({
    valveState: 'closed',
    filterState: 'active',
    pumpState: 'running',
    systemHealth: 'good',
    lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    uptime: 95.7,
    efficiency: 87.5,
    temperature: 42.3,
    pressure: 2.1,
    flowRate: 15.2
  })
  const [controlStates, setControlStates] = useState({
    valve: false,
    pump: true,
    filter: true,
    autoMode: true
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [isControlling, setIsControlling] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch system data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getCurrentReading()
        setCurrentData(response)
        
        // Update system status based on sensor data
        setSystemStatus(prev => ({
          ...prev,
          temperature: response?.temperature || prev.temperature,
          lastUpdate: new Date()
        }))
      } catch (error) {
        console.error('Error fetching system data:', error)
      }
    }

    // Initial fetch on mount - WebSocket will handle subsequent updates
    fetchData()
    
    return () => {
      // Cleanup if needed
    }
  }, []) // Removed function dependency to prevent constant re-renders

  // Handle manual data refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh WebSocket data
      refreshData()
      
      // Fetch fresh API data
      const response = await getCurrentReading()
      setCurrentData(response)
      
      // Update system status
      setSystemStatus(prev => ({
        ...prev,
        temperature: response?.temperature || prev.temperature,
        lastUpdate: new Date()
      }))
      
      // Show success feedback
      console.log('Data refreshed successfully!')
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle control commands
  const handleControl = async (command) => {
    if (isControlling) return
    
    setIsControlling(true)
    try {
      await executeControl(command)
      
      // Update control states based on command
      switch (command) {
        case '0': // Open valve
          setControlStates(prev => ({ ...prev, valve: true }))
          setSystemStatus(prev => ({ ...prev, valveState: 'open' }))
          break
        case 'C': // Close valve
          setControlStates(prev => ({ ...prev, valve: false }))
          setSystemStatus(prev => ({ ...prev, valveState: 'closed' }))
          break
        case 'r': // Rotate filter
          setSystemStatus(prev => ({ ...prev, filterState: 'rotating' }))
          setTimeout(() => {
            setSystemStatus(prev => ({ ...prev, filterState: 'active' }))
          }, 3000)
          break
        default:
          break
      }
    } catch (error) {
      console.error('Control command failed:', error)
    } finally {
      setIsControlling(false)
    }
  }

  const getSystemHealthColor = (health) => {
    switch (health) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getSystemHealthIcon = (health) => {
    switch (health) {
      case 'excellent': return CheckCircle
      case 'good': return CheckCircle
      case 'warning': return AlertTriangle
      case 'critical': return AlertTriangle
      default: return Activity
    }
  }

  const performanceMetrics = [
    {
      name: 'System Uptime',
      value: systemStatus.uptime,
      unit: '%',
      icon: Clock,
      color: 'blue',
      target: '> 95%'
    },
    {
      name: 'Processing Efficiency',
      value: systemStatus.efficiency,
      unit: '%',
      icon: Gauge,
      color: 'green',
      target: '> 85%'
    },
    {
      name: 'System Temperature',
      value: systemStatus.temperature,
      unit: '°C',
      icon: Thermometer,
      color: systemStatus.temperature > 45 ? 'red' : 'blue',
      target: '< 45°C'
    },
    {
      name: 'Water Pressure',
      value: systemStatus.pressure,
      unit: 'bar',
      icon: Gauge,
      color: systemStatus.pressure > 2.5 ? 'yellow' : 'green',
      target: '1.5-2.5 bar'
    },
    {
      name: 'Flow Rate',
      value: systemStatus.flowRate,
      unit: 'L/min',
      icon: Droplets,
      color: 'blue',
      target: '10-20 L/min'
    }
  ]

  const hardwareComponents = [
    {
      name: 'Main Valve',
      status: systemStatus.valveState,
      icon: Zap,
      color: systemStatus.valveState === 'open' ? 'green' : 'gray',
      action: () => handleControl(systemStatus.valveState === 'open' ? 'C' : '0')
    },
    {
      name: 'Water Pump',
      status: systemStatus.pumpState,
      icon: PlayCircle,
      color: systemStatus.pumpState === 'running' ? 'green' : 'red',
      action: () => {
        setSystemStatus(prev => ({ 
          ...prev, 
          pumpState: prev.pumpState === 'running' ? 'stopped' : 'running' 
        }))
      }
    },
    {
      name: 'Filter System',
      status: systemStatus.filterState,
      icon: Shield,
      color: systemStatus.filterState === 'active' ? 'green' : 'yellow',
      action: () => handleControl('r')
    },
    {
      name: 'Sensor Array',
      status: connected ? 'online' : 'offline',
      icon: Radio,
      color: connected ? 'green' : 'red',
      action: () => {}
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Monitor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time system monitoring and hardware control
          </p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
              {connected ? 'System Online' : 'System Offline'}
            </span>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isRefreshing 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* System Health Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Overall System Health</h3>
            <p className="text-blue-100">All critical systems operational</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {React.createElement(getSystemHealthIcon(systemStatus.systemHealth), { 
                  size: 32,
                  className: 'mx-auto mb-2' 
                })}
              </div>
              <div className="text-sm text-blue-100">Status: {systemStatus.systemHealth.toUpperCase()}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{systemStatus.uptime}%</div>
              <div className="text-sm text-blue-100">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round((Date.now() - systemStatus.lastMaintenance) / (1000 * 60 * 60 * 24))}d</div>
              <div className="text-sm text-blue-100">Since Maintenance</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {['overview', 'hardware', 'performance', 'controls'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {performanceMetrics.map((metric, index) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      metric.color === 'green' ? 'bg-green-100 text-green-600' :
                      metric.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      metric.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <metric.icon size={20} />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {metric.value} {metric.unit}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {metric.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Target: {metric.target}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Current Water Quality
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">pH Level:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentData?.ph || 7.2}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">TDS:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentData?.tds || 245} ppm
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">ORP:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentData?.orp || 456} mV
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Turbidity:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {currentData?.turbidity || 0.3} NTU
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Recent Alerts
                </h3>
                <div className="space-y-3">
                  {alerts.length > 0 ? (
                    alerts.slice(0, 4).map((alert, index) => (
                      <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <AlertTriangle size={16} className="text-yellow-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {alert.message}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                      <p className="text-sm">No active alerts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'hardware' && (
          <motion.div
            key="hardware"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {hardwareComponents.map((component, index) => (
                <motion.div
                  key={component.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      component.color === 'green' ? 'bg-green-100 text-green-600' :
                      component.color === 'red' ? 'bg-red-100 text-red-600' :
                      component.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <component.icon size={24} />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      component.color === 'green' ? 'bg-green-100 text-green-800' :
                      component.color === 'red' ? 'bg-red-100 text-red-800' :
                      component.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {component.status.toUpperCase()}
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {component.name}
                  </h3>
                  <button
                    onClick={component.action}
                    disabled={isControlling}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      isControlling
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isControlling ? 'Processing...' : 'Toggle'}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div
            key="performance"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Performance Analytics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
                  <Server className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    System Load
                  </h4>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {systemStatus.efficiency}%
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    Processing capacity
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
                  <Database className="w-12 h-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
                  <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                    Data Throughput
                  </h4>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {systemStatus.flowRate} L/min
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Water processing rate
                  </p>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
                  <Cpu className="w-12 h-12 mx-auto mb-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    CPU Usage
                  </h4>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round(systemStatus.temperature * 2)}%
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                    Processing load
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'controls' && (
          <motion.div
            key="controls"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                System Controls
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Manual Controls</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleControl('0')}
                      disabled={isControlling}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <PlayCircle size={20} />
                      <span>Open Main Valve</span>
                    </button>
                    <button
                      onClick={() => handleControl('C')}
                      disabled={isControlling}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <PauseCircle size={20} />
                      <span>Close Main Valve</span>
                    </button>
                    <button
                      onClick={() => handleControl('r')}
                      disabled={isControlling}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <RotateCcw size={20} />
                      <span>Rotate Filter</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Automation Settings</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Auto Mode</span>
                      <button
                        onClick={() => setControlStates(prev => ({ ...prev, autoMode: !prev.autoMode }))}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          controlStates.autoMode ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          controlStates.autoMode ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Emergency Stop</span>
                      <button className="py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        <Power size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SystemMonitor 