import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Droplets, 
  Eye, 
  Zap, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Target, 
  Thermometer,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  RefreshCw,
  Gauge,
  Clock,
  Shield
} from 'lucide-react'

const WaterStatus = ({ isOpen, onClose, currentData, mlAnalysis }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [animationKey, setAnimationKey] = useState(0)

  // Trigger animation refresh when data changes
  useEffect(() => {
    if (currentData) {
      setAnimationKey(prev => prev + 1)
    }
  }, [currentData])

  const getQualityStatus = (value, type) => {
    const ranges = {
      tds: { excellent: [150, 300], good: [100, 400], warning: [50, 600] },
      ph: { excellent: [6.8, 7.5], good: [6.5, 8.0], warning: [6.0, 8.5] },
      orp: { excellent: [400, 600], good: [300, 700], warning: [200, 800] },
      turbidity: { excellent: [0, 0.5], good: [0, 1.0], warning: [0, 2.0] }
    }

    const range = ranges[type]
    if (!range) return { status: 'unknown', color: 'gray', icon: Minus }

    if (value >= range.excellent[0] && value <= range.excellent[1]) {
      return { status: 'excellent', color: 'green', icon: CheckCircle }
    } else if (value >= range.good[0] && value <= range.good[1]) {
      return { status: 'good', color: 'blue', icon: CheckCircle }
    } else if (value >= range.warning[0] && value <= range.warning[1]) {
      return { status: 'warning', color: 'yellow', icon: AlertTriangle }
    } else {
      return { status: 'critical', color: 'red', icon: AlertTriangle }
    }
  }

  const getOverallScore = () => {
    if (!currentData) return 0
    
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
    
    return Math.round((
      statusScores[phStatus.status] +
      statusScores[tdsStatus.status] +
      statusScores[orpStatus.status] +
      statusScores[turbidityStatus.status]
    ) / 4)
  }

  const getRecommendations = () => {
    if (!currentData) return []
    
    const recommendations = []
    
    if (currentData.ph < 6.5) {
      recommendations.push({
        type: 'critical',
        message: 'pH too low - Consider alkaline treatment',
        icon: AlertTriangle,
        color: 'red'
      })
    } else if (currentData.ph > 8.5) {
      recommendations.push({
        type: 'critical',
        message: 'pH too high - Consider acidic treatment',
        icon: AlertTriangle,
        color: 'red'
      })
    } else {
      recommendations.push({
        type: 'good',
        message: 'pH levels within acceptable range',
        icon: CheckCircle,
        color: 'green'
      })
    }
    
    if (currentData.tds > 500) {
      recommendations.push({
        type: 'warning',
        message: 'High TDS - Consider additional filtration',
        icon: AlertTriangle,
        color: 'yellow'
      })
    } else if (currentData.tds < 100) {
      recommendations.push({
        type: 'warning',
        message: 'Low TDS - Water may be too pure',
        icon: AlertTriangle,
        color: 'yellow'
      })
    } else {
      recommendations.push({
        type: 'good',
        message: 'TDS levels optimal for consumption',
        icon: CheckCircle,
        color: 'green'
      })
    }
    
    if (currentData.orp < 300) {
      recommendations.push({
        type: 'warning',
        message: 'Low ORP - Increase disinfection',
        icon: Target,
        color: 'yellow'
      })
    } else {
      recommendations.push({
        type: 'good',
        message: 'ORP levels indicate good disinfection',
        icon: CheckCircle,
        color: 'green'
      })
    }
    
    if (currentData.turbidity > 1.0) {
      recommendations.push({
        type: 'critical',
        message: 'High turbidity - Check filtration system',
        icon: AlertTriangle,
        color: 'red'
      })
    } else {
      recommendations.push({
        type: 'good',
        message: 'Water clarity is excellent',
        icon: CheckCircle,
        color: 'green'
      })
    }
    
    return recommendations
  }

  const parameterData = [
    {
      name: 'pH Level',
      value: currentData?.ph || 0,
      unit: 'pH',
      icon: Droplets,
      target: '6.5-8.5',
      status: getQualityStatus(currentData?.ph || 0, 'ph'),
      change: currentData?.ph ? (currentData.ph - 7.0).toFixed(1) : '0'
    },
    {
      name: 'TDS Level',
      value: currentData?.tds || 0,
      unit: 'ppm',
      icon: Eye,
      target: '150-300',
      status: getQualityStatus(currentData?.tds || 0, 'tds'),
      change: currentData?.tds ? (currentData.tds - 225).toFixed(0) : '0'
    },
    {
      name: 'ORP Level',
      value: currentData?.orp || 0,
      unit: 'mV',
      icon: Zap,
      target: '300-600',
      status: getQualityStatus(currentData?.orp || 0, 'orp'),
      change: currentData?.orp ? (currentData.orp - 450).toFixed(0) : '0'
    },
    {
      name: 'Turbidity',
      value: currentData?.turbidity || 0,
      unit: 'NTU',
      icon: Activity,
      target: '< 1.0',
      status: getQualityStatus(currentData?.turbidity || 0, 'turbidity'),
      change: currentData?.turbidity ? (currentData.turbidity - 0.5).toFixed(2) : '0'
    },
    {
      name: 'Temperature',
      value: currentData?.temperature || 0,
      unit: '°C',
      icon: Thermometer,
      target: '20-25',
      status: { status: 'good', color: 'blue', icon: CheckCircle },
      change: currentData?.temperature ? (currentData.temperature - 22.5).toFixed(1) : '0'
    }
  ]

  const overallScore = getOverallScore()
  const recommendations = getRecommendations()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.div
                    key={animationKey}
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
                  >
                    <Droplets size={24} />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-bold">Water Quality Analysis</h2>
                    <p className="text-blue-100">Comprehensive real-time water monitoring</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <motion.div
                    key={`score-${animationKey}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-center"
                  >
                    <div className="text-3xl font-bold">{overallScore}</div>
                    <div className="text-sm text-blue-100">Quality Score</div>
                  </motion.div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                {['overview', 'parameters', 'analysis', 'recommendations'].map((tab) => (
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

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                          System Status
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 dark:text-blue-200">Filter Status:</span>
                            <span className="font-medium text-green-600">Active</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 dark:text-blue-200">Last Update:</span>
                            <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 dark:text-blue-200">Monitoring Mode:</span>
                            <span className="font-medium text-green-600">Real-time</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
                          AI Insights
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-purple-700 dark:text-purple-200">Prediction Confidence:</span>
                            <span className="font-medium">{mlAnalysis?.confidence ? (mlAnalysis.confidence * 100).toFixed(1) : 95.2}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-700 dark:text-purple-200">Filter Saturation:</span>
                            <span className="font-medium">{mlAnalysis?.filter_saturation || 45}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-purple-700 dark:text-purple-200">Replacement Due:</span>
                            <span className="font-medium">{mlAnalysis?.days_remaining || 12} days</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Quick Parameter Overview
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {parameterData.map((param, index) => (
                          <motion.div
                            key={param.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="text-center"
                          >
                            <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                              param.status.color === 'green' ? 'bg-green-100 text-green-600' :
                              param.status.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                              param.status.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              <param.icon size={20} />
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{param.name}</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">
                              {param.value} {param.unit}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'parameters' && (
                  <motion.div
                    key="parameters"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {parameterData.map((param, index) => (
                      <motion.div
                        key={param.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              param.status.color === 'green' ? 'bg-green-100 text-green-600' :
                              param.status.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                              param.status.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              <param.icon size={20} />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{param.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Target: {param.target}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {param.value} {param.unit}
                            </div>
                            <div className={`text-sm font-medium flex items-center ${
                              parseFloat(param.change) > 0 ? 'text-green-600' :
                              parseFloat(param.change) < 0 ? 'text-red-600' :
                              'text-gray-500'
                            }`}>
                              {parseFloat(param.change) > 0 ? <TrendingUp size={16} className="mr-1" /> :
                               parseFloat(param.change) < 0 ? <TrendingDown size={16} className="mr-1" /> :
                               <Minus size={16} className="mr-1" />}
                              {param.change}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center space-x-2 ${
                            param.status.color === 'green' ? 'text-green-600' :
                            param.status.color === 'blue' ? 'text-blue-600' :
                            param.status.color === 'yellow' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            <param.status.icon size={16} />
                            <span className="font-medium text-sm">{param.status.status.toUpperCase()}</span>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Last updated: {new Date().toLocaleTimeString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'analysis' && (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-6 text-center">
                        <Gauge className="w-12 h-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
                        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                          Overall Quality
                        </h3>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                          {overallScore}/100
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300 mt-2">
                          {overallScore >= 90 ? 'Excellent' : overallScore >= 70 ? 'Good' : overallScore >= 50 ? 'Fair' : 'Poor'}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-6 text-center">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                          Safety Level
                        </h3>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {overallScore >= 70 ? 'Safe' : 'Caution'}
                        </div>
                        <div className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                          WHO Standards
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-6 text-center">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                          Next Action
                        </h3>
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          {mlAnalysis?.days_remaining || 12} days
                        </div>
                        <div className="text-sm text-purple-700 dark:text-purple-300 mt-2">
                          Filter replacement
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Trend Analysis
                      </h3>
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        <RefreshCw size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Historical trend analysis will be available soon</p>
                        <p className="text-sm mt-2">Collecting data for meaningful insights...</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'recommendations' && (
                  <motion.div
                    key="recommendations"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`rounded-lg p-4 border-l-4 ${
                          rec.color === 'green' ? 'bg-green-50 border-green-400 dark:bg-green-900 dark:border-green-600' :
                          rec.color === 'yellow' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900 dark:border-yellow-600' :
                          'bg-red-50 border-red-400 dark:bg-red-900 dark:border-red-600'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <rec.icon className={`w-5 h-5 mt-0.5 ${
                            rec.color === 'green' ? 'text-green-600' :
                            rec.color === 'yellow' ? 'text-yellow-600' :
                            'text-red-600'
                          }`} />
                          <div>
                            <p className={`font-medium ${
                              rec.color === 'green' ? 'text-green-800 dark:text-green-200' :
                              rec.color === 'yellow' ? 'text-yellow-800 dark:text-yellow-200' :
                              'text-red-800 dark:text-red-200'
                            }`}>
                              {rec.message}
                            </p>
                            <p className={`text-sm mt-1 ${
                              rec.color === 'green' ? 'text-green-700 dark:text-green-300' :
                              rec.color === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' :
                              'text-red-700 dark:text-red-300'
                            }`}>
                              {rec.type === 'critical' ? 'Immediate attention required' :
                               rec.type === 'warning' ? 'Monitor closely' :
                               'System operating normally'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default WaterStatus 