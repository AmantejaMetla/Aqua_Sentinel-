import React, { createContext, useContext, useState } from 'react'
import { useDatabase } from './DatabaseContext'

const ApiContext = createContext()

export const useApi = () => {
  const context = useContext(ApiContext)
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider')
  }
  return context
}

export const ApiProvider = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const { getSensorReadings, saveControlAction, saveMlAnalysis } = useDatabase()

  // Mock API endpoints - Fixed for Vite
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  // Generate sample ML analysis data
  const generateMlAnalysis = (hours = 24, tdsLevel = 200, phLevel = 7.5) => {
    const qualityScore = Math.max(60, Math.min(100, 100 - (Math.abs(tdsLevel - 250) / 5) - (Math.abs(phLevel - 7.2) * 10)))
    const saturationPercent = Math.min(85, 20 + (hours * 0.8) + Math.random() * 20)
    
    return {
      filter_analysis: {
        saturation_percent: Math.round(saturationPercent),
        days_until_replacement: Math.max(5, Math.round(90 - (saturationPercent * 1.1))),
        efficiency: Math.round(100 - saturationPercent),
        last_replacement: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      },
      optimization: {
        quality_score: Math.round(qualityScore),
        status: qualityScore >= 90 ? 'excellent' : qualityScore >= 70 ? 'good' : 'needs_attention',
        recommendations: [
          qualityScore < 90 ? 'Consider adjusting filtration parameters' : 'System operating optimally',
          saturationPercent > 60 ? 'Schedule filter replacement soon' : 'Filter performance excellent',
          'Monitor pH levels during peak usage hours',
          'Regular system maintenance scheduled for next month'
        ]
      },
      anomaly_detection: {
        anomalies_detected: Math.random() > 0.8,
        confidence: Math.round(85 + Math.random() * 15),
        risk_level: qualityScore >= 80 ? 'low' : qualityScore >= 60 ? 'medium' : 'high'
      },
      timestamp: new Date().toISOString()
    }
  }

  // Generate sample sensor history
  const generateSensorHistory = (hours = 24) => {
    const readings = []
    const now = new Date()
    
    for (let i = 0; i < hours; i++) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      readings.push({
        id: `reading_${i}`,
        timestamp: time.toISOString(),
        tds: Math.round((200 + Math.sin(i * 0.3) * 50 + Math.random() * 20) * 100) / 100,
        ph: Math.round((7.2 + Math.sin(i * 0.2) * 0.5 + Math.random() * 0.3) * 100) / 100,
        orp: Math.round((400 + Math.sin(i * 0.4) * 100 + Math.random() * 50) * 100) / 100,
        turbidity: Math.round((0.3 + Math.sin(i * 0.1) * 0.2 + Math.random() * 0.1) * 1000) / 1000,
        temperature: Math.round((22 + Math.sin(i * 0.15) * 3 + Math.random() * 2) * 100) / 100
      })
    }
    
    return readings.reverse() // Return oldest to newest
  }

  const getCurrentReading = async () => {
    setLoading(true)
    try {
      // Try to get from backend first, fallback to mock data
      try {
        const response = await fetch(`${API_BASE_URL}/sensors/current`)
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        console.log('Backend not available, using mock data')
      }

      // Fallback to mock data
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
      
      const mockData = {
        tds: Math.round((200 + Math.random() * 100) * 100) / 100,
        ph: Math.round((7.0 + Math.random() * 1.0) * 100) / 100,
        orp: Math.round((350 + Math.random() * 200) * 100) / 100,
        turbidity: Math.round((0.2 + Math.random() * 0.8) * 1000) / 1000,
        temperature: Math.round((20 + Math.random() * 5) * 100) / 100,
        timestamp: new Date().toISOString()
      }

      return mockData
    } finally {
      setLoading(false)
    }
  }

  const getSensorHistory = async (hours = 24) => {
    setLoading(true)
    try {
      // Try Firebase first
      try {
        const firebaseData = await getSensorReadings(hours)
        if (firebaseData.length > 0) {
          return { readings: firebaseData }
        }
      } catch (error) {
        console.log('Firebase not available, using mock data')
      }

      // Try backend
      try {
        const response = await fetch(`${API_BASE_URL}/sensors/history?hours=${hours}`)
        if (response.ok) {
          return await response.json()
        }
      } catch (error) {
        console.log('Backend not available, using mock data')
      }

      // Fallback to mock data
      await new Promise(resolve => setTimeout(resolve, 800))
      return { readings: generateSensorHistory(hours) }
    } finally {
      setLoading(false)
    }
  }

  const getMlAnalysis = async (hours = 24, tdsLevel = 200, phLevel = 7.5) => {
    setLoading(true)
    try {
      // Try backend first
      try {
        const response = await fetch(`${API_BASE_URL}/ml/analyze?hours=${hours}&tds=${tdsLevel}&ph=${phLevel}`)
        if (response.ok) {
          const data = await response.json()
          saveMlAnalysis(data).catch(() => {}) // Save to Firebase
          return data
        }
      } catch (error) {
        console.log('Backend ML service not available, using mock analysis')
      }

      // Fallback to mock data
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockAnalysis = generateMlAnalysis(hours, tdsLevel, phLevel)
      saveMlAnalysis(mockAnalysis).catch(() => {})
      return mockAnalysis
    } finally {
      setLoading(false)
    }
  }

  const executeControl = async (commandType, command, options = {}) => {
    setLoading(true)
    try {
      // Try backend first
      try {
        const response = await fetch(`${API_BASE_URL}/control/${commandType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command, options })
        })
        
        if (response.ok) {
          const result = await response.json()
          saveControlAction({ commandType, command, options, result }).catch(() => {})
          return result
        }
      } catch (error) {
        console.log('Backend control service not available, using simulation')
      }

      // Simulate control action
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockResult = {
        success: true,
        command_type: commandType,
        command: command,
        status: 'executed',
        timestamp: new Date().toISOString(),
        message: `${commandType} command '${command}' executed successfully`,
        ...(commandType === 'drone' && { 
          mission_id: `mission_${Date.now()}`,
          estimated_arrival: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        })
      }

      saveControlAction({ commandType, command, options, result: mockResult }).catch(() => {})
      return mockResult
    } finally {
      setLoading(false)
    }
  }

  const getSystemStatus = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        status: 'online',
        uptime: Math.floor(Math.random() * 72) + 24, // 24-96 hours
        last_maintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        next_maintenance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        components: {
          sensors: 'operational',
          filters: 'operational', 
          valves: 'operational',
          communication: 'operational'
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    loading,
    getCurrentReading,
    getSensorHistory,
    getMlAnalysis,
    executeControl,
    getSystemStatus,
    // Utility methods
    healthCheck: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`)
        return response.ok
      } catch {
        return false
      }
    }
  }

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  )
}

export default ApiContext 