import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApi } from '../contexts/ApiContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import MetricCard from '../components/MetricCard'
import WaterQualityChart from '../components/WaterQualityChart'
import SystemStatus from '../components/SystemStatus'
import AlertPanel from '../components/AlertPanel'
import WaterStatus from '../animations/WaterStatus'
import performanceMetrics, { startSimulation, stopSimulation } from '../utils/performanceMetrics'
import { 
  Droplets, 
  Thermometer, 
  Zap, 
  Eye, 
  Activity,
  TrendingUp,
  Shield,
  Clock,
  Brain,
  Target,
  Gauge,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  Settings,
  PlayCircle,
  PauseCircle
} from 'lucide-react'

const Dashboard = () => {
  const { getCurrentReading, getMlAnalysis, loading } = useApi()
  const { sensorData, alerts, connected, refreshData, isRealTimeActive, updateInterval, setUpdateInterval, toggleRealTime } = useWebSocket()
  
  const [currentData, setCurrentData] = useState(null)
  const [mlAnalysis, setMlAnalysis] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [performanceData, setPerformanceData] = useState({
    accuracy: 95.2,
    efficiency: 87.5,
    scalability: 92.1,
    lastUpdated: new Date()
  })
  const [mlPredictions, setMlPredictions] = useState({
    nextPh: 7.2,
    nextTds: 245,
    nextOrp: 456,
    nextTurbidity: 0.3,
    confidence: 0.95,
    trend: 'stable'
  })
  const [showWaterStatusModal, setShowWaterStatusModal] = useState(false)
  const [animations, setAnimations] = useState({
    pulseAlert: false,
    slideChart: false,
    glowCards: false
  })

  // Fetch initial data and start ML simulation
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorResponse, mlResponse] = await Promise.all([
          getCurrentReading(),
          getMlAnalysis(24, 200, 30)
        ])
        setCurrentData(sensorResponse)
        setMlAnalysis(mlResponse)
        setLastUpdate(new Date())
        
        // Generate ML predictions for next values
        if (sensorResponse) {
          const predictions = generateMlPredictions(sensorResponse)
          setMlPredictions(predictions)
          
          // Track accuracy if we have previous predictions
          if (mlPredictions.nextPh) {
            performanceMetrics.trackAccuracy(mlPredictions.nextPh, sensorResponse.ph, 'ph')
            performanceMetrics.trackAccuracy(mlPredictions.nextTds, sensorResponse.tds, 'tds')
            performanceMetrics.trackAccuracy(mlPredictions.nextOrp, sensorResponse.orp, 'orp')
            performanceMetrics.trackAccuracy(mlPredictions.nextTurbidity, sensorResponse.turbidity, 'turbidity')
          }
        }
        
        // Update performance metrics based on ML analysis
        if (mlResponse) {
          setPerformanceData(prev => ({
            ...prev,
            accuracy: mlResponse.confidence * 100 || 95.2,
            efficiency: mlResponse.efficiency || 87.5,
            lastUpdated: new Date()
          }))
        }
        
        // Get real-time performance metrics
        const metrics = performanceMetrics.getCurrentMetrics()
        setPerformanceData({
          accuracy: metrics.accuracy.current,
          efficiency: metrics.efficiency.current,
          scalability: metrics.scalability.current,
          lastUpdated: new Date()
        })
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    // Start performance simulation
    startSimulation()
    
    // Initial fetch on mount - WebSocket will handle subsequent updates
    fetchData()
    
    return () => {
      stopSimulation()
    }
  }, []) // Removed function dependencies to prevent constant re-renders

  // Use WebSocket data if available
  useEffect(() => {
    if (sensorData) {
      setCurrentData(sensorData)
      setLastUpdate(new Date())
      
      // Generate new ML predictions based on current sensor data
      const predictions = generateMlPredictions(sensorData)
      setMlPredictions(predictions)
      
      // Update performance metrics with new data
      const metrics = performanceMetrics.getCurrentMetrics()
      setPerformanceData({
        accuracy: metrics.accuracy.current,
        efficiency: metrics.efficiency.current,
        scalability: metrics.scalability.current,
        lastUpdated: new Date()
      })
      
      // Generate updated ML analysis for AI Predictions section
      const updatedMlAnalysis = {
        filter_analysis: {
          saturation_percent: Math.round(20 + (sensorData.tds / 500) * 60 + Math.random() * 10),
          days_until_replacement: Math.round(5 + (1 - sensorData.turbidity / 2) * 20 + Math.random() * 5)
        },
        anomaly_detection: {
          confidence: predictions.confidence
        },
        last_updated: new Date().toISOString()
      }
      setMlAnalysis(updatedMlAnalysis)
      
      // Trigger animations based on sensor data
      checkThresholds(sensorData)
    }
  }, [sensorData])

  // Generate ML predictions based on current data
  const generateMlPredictions = (currentData) => {
    // Simple ML prediction simulation - in real implementation, this would call actual ML models
    const phTrend = Math.random() > 0.5 ? 0.1 : -0.1
    const tdsTrend = Math.random() > 0.5 ? 5 : -5
    const orpTrend = Math.random() > 0.5 ? 10 : -10
    const turbidityTrend = Math.random() > 0.5 ? 0.05 : -0.05
    
    return {
      nextPh: Math.max(6.0, Math.min(8.5, currentData.ph + phTrend + (Math.random() - 0.5) * 0.05)),
      nextTds: Math.max(100, Math.min(500, currentData.tds + tdsTrend + (Math.random() - 0.5) * 10)),
      nextOrp: Math.max(200, Math.min(800, currentData.orp + orpTrend + (Math.random() - 0.5) * 20)),
      nextTurbidity: Math.max(0, Math.min(2.0, currentData.turbidity + turbidityTrend + (Math.random() - 0.5) * 0.02)),
      confidence: 0.85 + Math.random() * 0.15,
      trend: Math.random() > 0.6 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'declining',
      timestamp: Date.now()
    }
  }

  // Check thresholds and trigger animations
  const checkThresholds = (data) => {
    if (!data) return
    
    const thresholdBreaches = [
      { param: 'ph', value: data.ph, min: 6.5, max: 8.5 },
      { param: 'tds', value: data.tds, min: 150, max: 300 },
      { param: 'orp', value: data.orp, min: 300, max: 600 },
      { param: 'turbidity', value: data.turbidity, min: 0, max: 1.0 }
    ]
    
    const hasBreaches = thresholdBreaches.some(t => t.value < t.min || t.value > t.max)
    
    if (hasBreaches) {
      setAnimations(prev => ({
        ...prev,
        pulseAlert: true,
        slideChart: true,
        glowCards: true
      }))
      
      // Reset animations after 2 seconds
      setTimeout(() => {
        setAnimations(prev => ({
          ...prev,
          pulseAlert: false,
          slideChart: false,
          glowCards: false
        }))
      }, 2000)
    }
  }

  // Helper function to get quality status and color
  const getQualityStatus = (value, type) => {
    const ranges = {
      tds: { excellent: [150, 300], good: [100, 400], warning: [50, 600] },
      ph: { excellent: [6.8, 7.5], good: [6.5, 8.0], warning: [6.0, 8.5] },
      orp: { excellent: [400, 600], good: [300, 700], warning: [200, 800] },
      turbidity: { excellent: [0, 0.5], good: [0, 1.0], warning: [0, 2.0] }
    }

    const range = ranges[type]
    if (!range) return { status: 'unknown', color: 'gray' }

    if (value >= range.excellent[0] && value <= range.excellent[1]) {
      return { status: 'excellent', color: 'green' }
    } else if (value >= range.good[0] && value <= range.good[1]) {
      return { status: 'good', color: 'blue' }
    } else if (value >= range.warning[0] && value <= range.warning[1]) {
      return { status: 'warning', color: 'yellow' }
    } else {
      return { status: 'critical', color: 'red' }
    }
  }

  const getOverallWaterQuality = () => {
    if (!currentData) return { score: 0, status: 'unknown', color: 'gray' }
    
    const phStatus = getQualityStatus(currentData.ph, 'ph')
    const tdsStatus = getQualityStatus(currentData.tds, 'tds')
    const orpStatus = getQualityStatus(currentData.orp, 'orp')
    const turbidityStatus = getQualityStatus(currentData.turbidity, 'turbidity')
    
    const statusScores = {
      excellent: 100,
      good: 80,
      warning: 60,
      critical: 30,
      unknown: 0
    }
    
    const avgScore = (
      statusScores[phStatus.status] +
      statusScores[tdsStatus.status] +
      statusScores[orpStatus.status] +
      statusScores[turbidityStatus.status]
    ) / 4
    
    let status = 'excellent'
    let color = 'green'
    
    if (avgScore < 40) {
      status = 'critical'
      color = 'red'
    } else if (avgScore < 60) {
      status = 'warning'
      color = 'yellow'
    } else if (avgScore < 80) {
      status = 'good'
      color = 'blue'
    }
    
    return { score: Math.round(avgScore), status, color }
  }

  // Handle manual data refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Refresh WebSocket data
      refreshData()
      
      // Fetch fresh data from all sources
      const [sensorResponse, mlResponse] = await Promise.all([
        getCurrentReading(),
        getMlAnalysis(24, 200, 30)
      ])
      
      setCurrentData(sensorResponse)
      setMlAnalysis(mlResponse)
      setLastUpdate(new Date())
      
      // Generate fresh ML predictions
      if (sensorResponse) {
        const predictions = generateMlPredictions(sensorResponse)
        setMlPredictions(predictions)
      }
      
      // Update performance metrics
      if (mlResponse) {
        setPerformanceData(prev => ({
          ...prev,
          accuracy: mlResponse.confidence * 100 || 95.2,
          efficiency: mlResponse.efficiency || 87.5,
          lastUpdated: new Date()
        }))
      }
      
      // Also update performance metrics from the performance tracking system
      const metrics = performanceMetrics.getCurrentMetrics()
      setPerformanceData({
        accuracy: metrics.accuracy.current,
        efficiency: metrics.efficiency.current,
        scalability: metrics.scalability.current,
        lastUpdated: new Date()
      })
      
      console.log('Dashboard data refreshed successfully!')
    } catch (error) {
      console.error('Error refreshing dashboard data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Update interval options
  const updateIntervalOptions = [
    { value: 60000, label: '1 minute', description: 'Minimum safe interval' },
    { value: 120000, label: '2 minutes', description: 'Moderate' },
    { value: 300000, label: '5 minutes', description: 'Recommended' },
    { value: 600000, label: '10 minutes', description: 'Slow' },
    { value: 1800000, label: '30 minutes', description: 'Very slow' }
  ]

  // Handle interval change
  const handleIntervalChange = (newInterval) => {
    setUpdateInterval(newInterval)
    // Show confirmation
    const option = updateIntervalOptions.find(opt => opt.value === newInterval)
    console.log(`Update interval changed to: ${option.label}`)
  }

  if (loading && !currentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    )
  }

  const waterQuality = getOverallWaterQuality()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">AquaSentinel Dashboard</h1>
          <div className="flex items-center space-x-4">
            <motion.div
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                connected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}
              animate={{ scale: connected ? 1 : [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: connected ? 0 : Infinity }}
            >
              {connected ? 'Connected' : 'Disconnected'}
            </motion.div>
            
            {/* Settings Button */}
            <motion.button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-blue-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>
            
            {/* Real-time Toggle */}
            <motion.button
              onClick={toggleRealTime}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isRealTimeActive 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRealTimeActive ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
              <span>{isRealTimeActive ? 'Pause' : 'Resume'}</span>
            </motion.button>
            
            {/* Refresh Button */}
            <motion.button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </motion.button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Update Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Frequency
                  </label>
                  <select
                    value={updateInterval}
                    onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {updateIntervalOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {updateIntervalOptions.find(opt => opt.value === updateInterval)?.description}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Real-time Status
                  </label>
                  <div className={`p-3 rounded-md ${isRealTimeActive ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-800'}`}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isRealTimeActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span className="text-sm font-medium">
                        {isRealTimeActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-xs mt-1">
                      {isRealTimeActive ? 'Data updates automatically' : 'Manual refresh only'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Performance Impact
                  </label>
                  <div className="p-3 bg-blue-50 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {updateInterval <= 10000 ? 'High' : updateInterval <= 60000 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      CPU & Network Usage
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Performance Metrics Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">System Performance Metrics</h3>
              <p className="text-blue-100">Real-time evaluation of AI accuracy, efficiency, and scalability</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{performanceData.accuracy.toFixed(1)}%</div>
                <div className="text-sm text-blue-100">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{performanceData.efficiency.toFixed(1)}%</div>
                <div className="text-sm text-blue-100">Efficiency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{performanceData.scalability.toFixed(1)}%</div>
                <div className="text-sm text-blue-100">Scalability</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interactive Water Status Widget */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={animations.glowCards ? { boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' } : {}}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer mb-8"
          onClick={() => setShowWaterStatusModal(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                waterQuality.color === 'green' ? 'bg-green-100 text-green-600' :
                waterQuality.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                waterQuality.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                <Droplets size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Water Quality Score
                </h3>
                <p className="text-gray-600">
                  Click for detailed analysis
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">
                {waterQuality.score}
              </div>
              <div className={`text-sm font-medium ${
                waterQuality.color === 'green' ? 'text-green-600' :
                waterQuality.color === 'blue' ? 'text-blue-600' :
                waterQuality.color === 'yellow' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {waterQuality.status.toUpperCase()}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Perfect Grid Layout for Sensor Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="h-full"
          >
            <MetricCard
              title="pH Level"
              value={currentData?.ph || 0}
              unit="pH"
              icon={Droplets}
              status={getQualityStatus(currentData?.ph || 0, 'ph')}
              change={currentData?.ph ? (currentData.ph - 7.0).toFixed(1) : '0'}
              description="Optimal range: 6.8-7.5"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="h-full"
          >
            <MetricCard
              title="TDS Level"
              value={currentData?.tds || 0}
              unit="ppm"
              icon={Eye}
              status={getQualityStatus(currentData?.tds || 0, 'tds')}
              change={currentData?.tds ? (currentData.tds - 225).toFixed(0) : '0'}
              description="Optimal range: 150-300 ppm"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="h-full"
          >
            <MetricCard
              title="ORP Level"
              value={currentData?.orp || 0}
              unit="mV"
              icon={Zap}
              status={getQualityStatus(currentData?.orp || 0, 'orp')}
              change={currentData?.orp ? (currentData.orp - 450).toFixed(0) : '0'}
              description="Optimal range: 400-600 mV"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            className="h-full"
          >
            <MetricCard
              title="Turbidity"
              value={currentData?.turbidity || 0}
              unit="NTU"
              icon={Activity}
              status={getQualityStatus(currentData?.turbidity || 0, 'turbidity')}
              change={currentData?.turbidity ? (currentData.turbidity - 0.5).toFixed(2) : '0'}
              description="Optimal range: 0-0.5 NTU"
            />
          </motion.div>
        </div>

        {/* AI/ML Analysis Section */}
        {mlAnalysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Brain size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  AI Predictions & Analysis
                </h3>
                <p className="text-sm text-gray-600">
                  Machine learning insights and recommendations
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {mlAnalysis.filter_analysis?.saturation_percent || 45}%
                </div>
                <div className="text-sm text-gray-600">Filter Saturation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {mlAnalysis.filter_analysis?.days_until_replacement || 12} days
                </div>
                <div className="text-sm text-gray-600">Until Replacement</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {mlAnalysis.anomaly_detection?.confidence ? (mlAnalysis.anomaly_detection.confidence * 100).toFixed(1) : 95.2}%
                </div>
                <div className="text-sm text-gray-600">Prediction Confidence</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Real-time ML Predictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Next 5-Minute Predictions
              </h3>
              <p className="text-sm text-gray-600">
                Real-time ML predictions with {(mlPredictions.confidence * 100).toFixed(1)}% confidence
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              mlPredictions.trend === 'improving' ? 'bg-green-100 text-green-800' :
              mlPredictions.trend === 'stable' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {mlPredictions.trend.toUpperCase()}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-lg font-bold text-indigo-600">
                {mlPredictions.nextPh.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">pH Level</div>
              <div className="text-xs text-gray-500 mt-1">
                {mlPredictions.nextPh > currentData?.ph ? '+' : ''}{(mlPredictions.nextPh - (currentData?.ph || 0)).toFixed(2)}
              </div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-lg font-bold text-indigo-600">
                {Math.round(mlPredictions.nextTds)}
              </div>
              <div className="text-sm text-gray-600">TDS (ppm)</div>
              <div className="text-xs text-gray-500 mt-1">
                {mlPredictions.nextTds > currentData?.tds ? '+' : ''}{Math.round(mlPredictions.nextTds - (currentData?.tds || 0))}
              </div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-lg font-bold text-indigo-600">
                {Math.round(mlPredictions.nextOrp)}
              </div>
              <div className="text-sm text-gray-600">ORP (mV)</div>
              <div className="text-xs text-gray-500 mt-1">
                {mlPredictions.nextOrp > currentData?.orp ? '+' : ''}{Math.round(mlPredictions.nextOrp - (currentData?.orp || 0))}
              </div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-lg font-bold text-indigo-600">
                {mlPredictions.nextTurbidity.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Turbidity (NTU)</div>
              <div className="text-xs text-gray-500 mt-1">
                {mlPredictions.nextTurbidity > currentData?.turbidity ? '+' : ''}{(mlPredictions.nextTurbidity - (currentData?.turbidity || 0)).toFixed(2)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts and System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <WaterQualityChart />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SystemStatus mlAnalysis={mlAnalysis} />
          </motion.div>
        </div>

        {/* Alerts Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <AlertPanel />
        </motion.div>
      </div>

      {/* Water Status Modal */}
      <WaterStatus
        isOpen={showWaterStatusModal}
        onClose={() => setShowWaterStatusModal(false)}
        currentData={currentData}
        mlAnalysis={mlAnalysis}
      />
    </div>
  )
}

export default Dashboard 