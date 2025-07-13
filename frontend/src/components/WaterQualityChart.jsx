import React, { useState, useEffect, useRef, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { useApi } from '../contexts/ApiContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { Clock, TrendingUp, AlertTriangle, Activity, RefreshCw } from 'lucide-react'

const WaterQualityChart = () => {
  const { getSensorHistory } = useApi()
  const { sensorData, updateInterval } = useWebSocket()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastDataUpdate, setLastDataUpdate] = useState(Date.now())
  const [selectedMetrics, setSelectedMetrics] = useState({
    tds: true,
    ph: true,
    orp: true,
    turbidity: true,
    temperature: false
  })

  // Refs for throttling
  const dataUpdateTimeoutRef = useRef(null)
  const lastSensorDataRef = useRef(null)

  // Debounced data update function
  const debouncedUpdateData = useCallback((newSensorData) => {
    if (dataUpdateTimeoutRef.current) {
      clearTimeout(dataUpdateTimeoutRef.current)
    }

    // Only update if data has actually changed
    if (JSON.stringify(newSensorData) === JSON.stringify(lastSensorDataRef.current)) {
      return
    }

    dataUpdateTimeoutRef.current = setTimeout(() => {
      setData(prevData => {
        const newEntry = {
          timestamp: newSensorData.timestamp,
          time: new Date(newSensorData.timestamp).toLocaleTimeString(),
          tds: newSensorData.tds,
          ph: newSensorData.ph,
          orp: newSensorData.orp,
          turbidity: newSensorData.turbidity,
          temperature: newSensorData.temperature
        }

        // Keep only last 50 data points for performance
        const maxDataPoints = 50
        const updatedData = [...prevData, newEntry].slice(-maxDataPoints)
        
        setLastDataUpdate(Date.now())
        lastSensorDataRef.current = newSensorData
        
        return updatedData
      })
    }, Math.max(1000, updateInterval / 4)) // Throttle to 1/4 of update interval, minimum 1 second
  }, [updateInterval])

  // Listen for sensor data changes with throttling
  useEffect(() => {
    if (sensorData) {
      debouncedUpdateData(sensorData)
    }
  }, [sensorData, debouncedUpdateData])

  // Fetch historical data
  const fetchHistoricalData = async () => {
    setLoading(true)
    try {
      const response = await getSensorHistory(parseInt(timeRange))
      if (response && response.readings) {
        const formattedData = response.readings.map(reading => ({
          timestamp: reading.timestamp,
          time: new Date(reading.timestamp).toLocaleTimeString(),
          tds: reading.tds,
          ph: reading.ph,
          orp: reading.orp,
          turbidity: reading.turbidity,
          temperature: reading.temperature
        }))
        setData(formattedData)
      }
    } catch (error) {
      console.error('Error fetching historical data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchHistoricalData()
  }, [timeRange])

  // Manual refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchHistoricalData()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dataUpdateTimeoutRef.current) {
        clearTimeout(dataUpdateTimeoutRef.current)
      }
    }
  }, [])

  // Get chart colors
  const getMetricColor = (metric) => {
    const colors = {
      tds: '#3b82f6',
      ph: '#10b981',
      orp: '#f59e0b',
      turbidity: '#ef4444',
      temperature: '#8b5cf6'
    }
    return colors[metric] || '#6b7280'
  }

  // Get metric display name
  const getMetricDisplayName = (metric) => {
    const names = {
      tds: 'TDS (ppm)',
      ph: 'pH Level',
      orp: 'ORP (mV)',
      turbidity: 'Turbidity (NTU)',
      temperature: 'Temperature (°C)'
    }
    return names[metric] || metric
  }

  // Calculate data freshness
  const dataFreshness = (Date.now() - lastDataUpdate) / 1000 // seconds
  const isDataFresh = dataFreshness < updateInterval / 1000 * 2

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Water Quality Trends</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Last {timeRange} hours</span>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isDataFresh ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span>{isDataFresh ? 'Live' : `${Math.round(dataFreshness)}s ago`}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1">Last hour</option>
            <option value="6">Last 6 hours</option>
            <option value="24">Last 24 hours</option>
            <option value="48">Last 48 hours</option>
            <option value="168">Last week</option>
          </select>
          
          {/* Refresh Button */}
          <motion.button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </motion.button>
        </div>
      </div>

      {/* Metric Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Display Metrics</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(selectedMetrics).map(([metric, selected]) => (
            <motion.button
              key={metric}
              onClick={() => setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }))}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all duration-200 ${
                selected
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={{ backgroundColor: selected ? getMetricColor(metric) : undefined }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {getMetricDisplayName(metric)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 text-gray-500">
              <Activity className="w-5 h-5 animate-spin" />
              <span>Loading chart data...</span>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No data available for the selected time range</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              
              {Object.entries(selectedMetrics).map(([metric, selected]) => (
                selected && (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={getMetricColor(metric)}
                    strokeWidth={2}
                    dot={{ fill: getMetricColor(metric), strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: getMetricColor(metric), strokeWidth: 2 }}
                    name={getMetricDisplayName(metric)}
                    connectNulls={false}
                  />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-gray-600">Data Points: {data.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-gray-600">Update Rate: {updateInterval / 1000}s</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3 text-gray-500" />
            <span className="text-gray-600">Throttled: {updateInterval / 4000}s</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isDataFresh ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-gray-600">
              {isDataFresh ? 'Real-time' : 'Delayed'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default WaterQualityChart 