import React, { createContext, useContext, useState, useEffect } from 'react'
import { databaseService } from '../services/database'

const DatabaseContext = createContext()

export const useDatabase = () => {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }
  return context
}

export const DatabaseProvider = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Helper function to handle async operations
  const handleAsyncOperation = async (operation, fallbackValue = null) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await operation()
      return result
    } catch (error) {
      console.error('Database operation failed:', error)
      setError(error.message)
      return fallbackValue
    } finally {
      setLoading(false)
    }
  }

  // Sensor data operations
  const saveSensorReading = async (sensorData) => {
    return await handleAsyncOperation(
      () => databaseService.saveSensorReading(sensorData),
      `demo_reading_${Date.now()}`
    )
  }

  const getSensorReadings = async (hours = 24, limitCount = 100) => {
    return await handleAsyncOperation(
      () => databaseService.getSensorReadings(hours, limitCount),
      []
    )
  }

  const subscribeToSensorData = (callback, hours = 1) => {
    try {
      return databaseService.subscribeToSensorData(callback, hours)
    } catch (error) {
      console.error('Error subscribing to sensor data:', error)
      return () => {} // Return empty unsubscribe function
    }
  }

  const batchWriteSensorData = async (readings) => {
    return await handleAsyncOperation(
      () => databaseService.batchWriteSensorData(readings),
      null
    )
  }

  // Alert operations
  const saveAlert = async (alertData) => {
    return await handleAsyncOperation(
      () => databaseService.saveAlert(alertData),
      `demo_alert_${Date.now()}`
    )
  }

  const getAlerts = async (limitCount = 50) => {
    return await handleAsyncOperation(
      () => databaseService.getAlerts(limitCount),
      []
    )
  }

  const markAlertAsRead = async (alertId) => {
    return await handleAsyncOperation(
      () => databaseService.markAlertAsRead(alertId),
      null
    )
  }

  const resolveAlert = async (alertId) => {
    return await handleAsyncOperation(
      () => databaseService.resolveAlert(alertId),
      null
    )
  }

  const subscribeToAlerts = (callback) => {
    try {
      return databaseService.subscribeToAlerts(callback)
    } catch (error) {
      console.error('Error subscribing to alerts:', error)
      return () => {} // Return empty unsubscribe function
    }
  }

  // User settings operations
  const saveUserSettings = async (settings) => {
    return await handleAsyncOperation(
      () => databaseService.saveUserSettings(settings),
      null
    )
  }

  const getUserSettings = async () => {
    return await handleAsyncOperation(
      () => databaseService.getUserSettings(),
      {
        theme: 'light',
        refreshInterval: 30,
        compactMode: false,
        notifications: {
          email: true,
          sms: false,
          push: true
        }
      }
    )
  }

  // Control action operations
  const saveControlAction = async (actionData) => {
    return await handleAsyncOperation(
      () => databaseService.saveControlAction(actionData),
      `demo_action_${Date.now()}`
    )
  }

  const getControlActions = async (limitCount = 50) => {
    return await handleAsyncOperation(
      () => databaseService.getControlActions(limitCount),
      []
    )
  }

  // ML analysis operations
  const saveMlAnalysis = async (analysisData) => {
    return await handleAsyncOperation(
      () => databaseService.saveMlAnalysis(analysisData),
      `demo_analysis_${Date.now()}`
    )
  }

  const getMlAnalysis = async (limitCount = 10) => {
    return await handleAsyncOperation(
      () => databaseService.getMlAnalysis(limitCount),
      []
    )
  }

  // Maintenance log operations
  const saveMaintenanceLog = async (logData) => {
    return await handleAsyncOperation(
      () => databaseService.saveMaintenanceLog(logData),
      `demo_maintenance_${Date.now()}`
    )
  }

  const getMaintenanceLogs = async (limitCount = 20) => {
    return await handleAsyncOperation(
      () => databaseService.getMaintenanceLogs(limitCount),
      []
    )
  }

  // System configuration
  const getSystemConfig = async () => {
    return await handleAsyncOperation(
      () => databaseService.getSystemConfig(),
      {}
    )
  }

  // Cleanup operations
  const cleanupOldData = async (days = 30) => {
    return await handleAsyncOperation(
      () => databaseService.cleanupOldData(days),
      null
    )
  }

  // Context value
  const value = {
    loading,
    error,
    // Sensor data
    saveSensorReading,
    getSensorReadings,
    subscribeToSensorData,
    batchWriteSensorData,
    // Alerts
    saveAlert,
    getAlerts,
    markAlertAsRead,
    resolveAlert,
    subscribeToAlerts,
    // User settings
    saveUserSettings,
    getUserSettings,
    // Control actions
    saveControlAction,
    getControlActions,
    // ML analysis
    saveMlAnalysis,
    getMlAnalysis,
    // Maintenance logs
    saveMaintenanceLog,
    getMaintenanceLogs,
    // System config
    getSystemConfig,
    // Cleanup
    cleanupOldData
  }

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  )
} 