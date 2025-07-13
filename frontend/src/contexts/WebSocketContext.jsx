import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useDatabase } from './DatabaseContext'

const WebSocketContext = createContext()

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export const WebSocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(true) // Simulate connection
  const [sensorData, setSensorData] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [connectionQuality, setConnectionQuality] = useState('excellent')
  const [latency, setLatency] = useState(0)
  const [throughput, setThroughput] = useState(0)
  const [anomalies, setAnomalies] = useState([])
  const [systemLoad, setSystemLoad] = useState(0)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [updateInterval, setUpdateInterval] = useState(30000) // 30 seconds - good balance for real-time feel
  const [isRealTimeActive, setIsRealTimeActive] = useState(true) // Start with live updates
  
  const { subscribeToSensorData, subscribeToAlerts, saveSensorReading, saveAlert } = useDatabase()
  const lastDataRef = useRef(null)
  const dataIntervalRef = useRef(null)
  const performanceRef = useRef({
    requests: 0,
    dataPoints: 0,
    startTime: Date.now()
  })

  // Detect anomalies in sensor data
  const detectAnomalies = (newData, previousData) => {
    if (!previousData) return []
    
    const anomalies = []
    const thresholds = {
      ph: { min: 6.0, max: 8.5, suddenChange: 0.5 },
      tds: { min: 50, max: 600, suddenChange: 100 },
      orp: { min: 200, max: 800, suddenChange: 150 },
      turbidity: { min: 0, max: 2.0, suddenChange: 0.5 },
      temperature: { min: 15, max: 30, suddenChange: 3 }
    }
    
    Object.keys(thresholds).forEach(param => {
      const threshold = thresholds[param]
      const current = newData[param]
      const previous = previousData[param]
      
      // Check for out-of-range values
      if (current < threshold.min || current > threshold.max) {
        anomalies.push({
          type: 'out_of_range',
          parameter: param,
          value: current,
          threshold: `${threshold.min}-${threshold.max}`,
          severity: 'critical',
          timestamp: newData.timestamp
        })
      }
      
      // Check for sudden changes
      if (Math.abs(current - previous) > threshold.suddenChange) {
        anomalies.push({
          type: 'sudden_change',
          parameter: param,
          value: current,
          previousValue: previous,
          change: current - previous,
          threshold: threshold.suddenChange,
          severity: 'warning',
          timestamp: newData.timestamp
        })
      }
    })
    
    return anomalies
  }

  // Generate realistic sample sensor data with drift patterns
  const generateSampleData = () => {
    const now = new Date()
    const timeSinceStart = (now.getTime() - performanceRef.current.startTime) / 1000 / 60 // minutes
    
    // Add slow drift patterns to simulate real sensor behavior
    const phDrift = Math.sin(timeSinceStart * 0.01) * 0.2
    const tdsDrift = Math.sin(timeSinceStart * 0.005) * 30
    const orpDrift = Math.cos(timeSinceStart * 0.008) * 50
    const turbidityDrift = Math.sin(timeSinceStart * 0.003) * 0.1
    
    // Base values with drift
    const baseData = {
      tds: Math.round((200 + tdsDrift + Math.random() * 50) * 100) / 100,
      ph: Math.round((7.2 + phDrift + Math.random() * 0.3) * 100) / 100,
      orp: Math.round((400 + orpDrift + Math.random() * 100) * 100) / 100,
      turbidity: Math.round((0.3 + turbidityDrift + Math.random() * 0.2) * 1000) / 1000,
      temperature: Math.round((22 + Math.random() * 3) * 100) / 100,
      timestamp: now.toISOString(),
      quality_status: 'excellent'
    }
    
    // Occasionally inject anomalies for testing (5% chance)
    if (Math.random() < 0.05) {
      const anomalyType = Math.random()
      if (anomalyType < 0.3) {
        baseData.ph = 5.8 + Math.random() * 0.5 // pH too low
      } else if (anomalyType < 0.6) {
        baseData.tds = 650 + Math.random() * 100 // TDS too high
      } else if (anomalyType < 0.8) {
        baseData.turbidity = 1.5 + Math.random() * 0.5 // Turbidity too high
      } else {
        baseData.orp = 150 + Math.random() * 50 // ORP too low
      }
    }
    
    // Update performance metrics
    performanceRef.current.dataPoints++
    performanceRef.current.requests++
    
    return baseData
  }

  // Generate sample alerts
  const generateSampleAlerts = () => [
    {
      id: '1',
      type: 'maintenance',
      severity: 'warning',
      message: 'Filter replacement recommended in 32 days',
      timestamp: new Date(Date.now() - 1800000).toISOString() // 30 mins ago
    },
    {
      id: '2',
      type: 'quality_check',
      severity: 'info',
      message: 'Water quality excellent - all parameters within optimal range',
      timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: '3',
      type: 'system_status',
      severity: 'success',
      message: 'System self-test completed successfully',
      timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    }
  ]

  useEffect(() => {
    // Initialize with sample data
    const initialData = generateSampleData()
    setSensorData(initialData)
    setAlerts(generateSampleAlerts())

    // Save initial sample data to Firebase
    saveSensorReading(initialData).catch(err => 
      console.log('Firebase not configured, using local data:', err.message)
    )

    // Generate sample alerts
    generateSampleAlerts().forEach(alert => {
      saveAlert(alert).catch(err => 
        console.log('Firebase not configured for alerts:', err.message)
      )
    })

    // Start real-time updates
    startRealTimeUpdates()

    // Try to connect to Firebase real-time listeners
    let unsubscribeSensors, unsubscribeAlerts

    try {
      unsubscribeSensors = subscribeToSensorData((firebaseData) => {
        if (firebaseData.length > 0) {
          setSensorData(firebaseData[0])
        }
      })

      unsubscribeAlerts = subscribeToAlerts((firebaseAlerts) => {
        if (firebaseAlerts.length > 0) {
          setAlerts(firebaseAlerts)
        }
      })
    } catch (error) {
      console.log('Firebase real-time listeners not available:', error.message)
    }

    // Cleanup
    return () => {
      stopRealTimeUpdates()
      if (unsubscribeSensors) unsubscribeSensors()
      if (unsubscribeAlerts) unsubscribeAlerts()
    }
  }, [subscribeToSensorData, subscribeToAlerts, saveSensorReading, saveAlert])

  // Start real-time data updates
  const startRealTimeUpdates = () => {
    if (dataIntervalRef.current) {
      clearInterval(dataIntervalRef.current)
    }
    
    if (!isRealTimeActive) return

    // SAFEGUARD: Prevent intervals shorter than 30 seconds
    const safeInterval = Math.max(30000, updateInterval)
    
    dataIntervalRef.current = setInterval(() => {
      const startTime = performance.now()
      const newData = generateSampleData()
      
      // Detect anomalies
      const detectedAnomalies = detectAnomalies(newData, lastDataRef.current)
      if (detectedAnomalies.length > 0) {
        setAnomalies(prev => [...detectedAnomalies, ...prev.slice(0, 19)]) // Keep last 20 anomalies
        
        // Create alerts for critical anomalies
        detectedAnomalies.forEach(anomaly => {
          if (anomaly.severity === 'critical') {
            const newAlert = {
              id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'anomaly_detection',
              severity: 'critical',
              message: `${anomaly.parameter.toUpperCase()} anomaly detected: ${anomaly.value} (${anomaly.type})`,
              timestamp: new Date().toISOString(),
              anomaly: anomaly
            }
            setAlerts(prev => [newAlert, ...prev.slice(0, 9)])
            saveAlert(newAlert).catch(() => {})
          }
        })
      }
      
      // Update sensor data
      setSensorData(newData)
      lastDataRef.current = newData
      
      // Calculate performance metrics
      const endTime = performance.now()
      const processingTime = endTime - startTime
      setLatency(Math.round(processingTime))
      
      // Calculate throughput (data points per minute)
      const currentTime = Date.now()
      const elapsedMinutes = (currentTime - performanceRef.current.startTime) / 1000 / 60
      setThroughput(Math.round(performanceRef.current.dataPoints / elapsedMinutes))
      
      // Calculate system load (simulated)
      const baseLoad = 30 + Math.sin(elapsedMinutes * 0.1) * 10
      const anomalyLoad = detectedAnomalies.length * 5
      setSystemLoad(Math.min(100, Math.max(0, baseLoad + anomalyLoad + Math.random() * 10)))
      
      // Update connection quality based on performance
      if (processingTime > 1000) {
        setConnectionQuality('poor')
      } else if (processingTime > 500) {
        setConnectionQuality('fair')
      } else if (processingTime > 200) {
        setConnectionQuality('good')
      } else {
        setConnectionQuality('excellent')
      }
      
      // Save to Firebase less frequently (every 5th update)
      if (Math.random() < 0.2) {
        saveSensorReading(newData).catch(() => {})
      }

      // Generate system status alerts occasionally
      if (Math.random() < 0.1) {
        const alertTypes = ['ph_warning', 'tds_notice', 'system_update', 'maintenance_reminder', 'performance_info']
        const severities = ['info', 'warning', 'success']
        const messages = [
          'pH level approaching upper threshold',
          'TDS levels stable and within range',
          'System optimization completed',
          'Scheduled maintenance in 7 days',
          `System performance: ${connectionQuality} (${latency}ms latency)`
        ]

        const newAlert = {
          id: Date.now().toString(),
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date().toISOString()
        }

        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]) // Keep only 10 alerts
        saveAlert(newAlert).catch(() => {})
      }
    }, safeInterval) // Use configurable interval
  }

  // Stop real-time updates
  const stopRealTimeUpdates = () => {
    if (dataIntervalRef.current) {
      clearInterval(dataIntervalRef.current)
      dataIntervalRef.current = null
    }
  }

  // Restart updates when interval changes
  useEffect(() => {
    if (isRealTimeActive) {
      startRealTimeUpdates()
    }
    return () => stopRealTimeUpdates()
  }, [updateInterval, isRealTimeActive])

  // Simulate connection status changes with reconnection logic
  useEffect(() => {
    const connectionInterval = setInterval(() => {
      // Rarely simulate disconnection (3% chance)
      if (Math.random() < 0.03 && connected) {
        setConnected(false)
        setConnectionQuality('poor')
        setReconnectAttempts(0)
        
        // Simulate reconnection attempts
        const reconnectInterval = setInterval(() => {
          setReconnectAttempts(prev => {
            const newAttempts = prev + 1
            
            // Simulate successful reconnection after 1-3 attempts
            if (newAttempts >= 1 && Math.random() < 0.7) {
              setConnected(true)
              setConnectionQuality('good')
              setReconnectAttempts(0)
              clearInterval(reconnectInterval)
              return 0
            }
            
            // Max 5 attempts
            if (newAttempts >= 5) {
              setConnected(true)
              setConnectionQuality('fair')
              clearInterval(reconnectInterval)
              return 0
            }
            
            return newAttempts
          })
        }, 2000) // Attempt every 2 seconds
      }
    }, 45000) // Check every 45 seconds

    return () => clearInterval(connectionInterval)
  }, [connected])

  const value = {
    // Connection status
    connected,
    connectionQuality,
    reconnectAttempts,
    
    // Real-time data
    sensorData,
    alerts,
    anomalies,
    
    // Performance metrics
    latency,
    throughput,
    systemLoad,
    
    // Real-time control
    isRealTimeActive,
    updateInterval,
    setUpdateInterval,
    toggleRealTime: () => {
      setIsRealTimeActive(prev => {
        const newState = !prev
        if (newState) {
          startRealTimeUpdates()
        } else {
          stopRealTimeUpdates()
        }
        return newState
      })
    },
    
    // WebSocket simulation methods
    sendMessage: (message) => {
      console.log('WebSocket message sent:', message)
      performanceRef.current.requests++
      return Promise.resolve({ success: true })
    },
    
    // Manual data refresh
    refreshData: () => {
      const newData = generateSampleData()
      const detectedAnomalies = detectAnomalies(newData, lastDataRef.current)
      if (detectedAnomalies.length > 0) {
        setAnomalies(prev => [...detectedAnomalies, ...prev.slice(0, 19)])
      }
      setSensorData(newData)
      lastDataRef.current = newData
      saveSensorReading(newData).catch(() => {})
    },
    
    // Force connection reset
    forceReconnect: () => {
      setConnected(false)
      setReconnectAttempts(0)
      setTimeout(() => {
        setConnected(true)
        setConnectionQuality('excellent')
      }, 1000)
    },
    
    // Clear anomalies
    clearAnomalies: () => {
      setAnomalies([])
    },
    
    // Get performance statistics
    getPerformanceStats: () => ({
      totalRequests: performanceRef.current.requests,
      totalDataPoints: performanceRef.current.dataPoints,
      uptime: Date.now() - performanceRef.current.startTime,
      averageLatency: latency,
      currentThroughput: throughput,
      systemLoad: systemLoad,
      connectionQuality: connectionQuality
    }),
    
    // Reset performance counters
    resetPerformanceStats: () => {
      performanceRef.current = {
        requests: 0,
        dataPoints: 0,
        startTime: Date.now()
      }
    }
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export default WebSocketContext 