/**
 * Performance Metrics Utility
 * Tracks and calculates accuracy, efficiency, and scalability metrics
 * for the AquaSentinel water intelligence system
 */

class PerformanceMetrics {
  constructor() {
    this.metrics = {
      accuracy: {
        predictions: [],
        actualResults: [],
        running: 0,
        count: 0
      },
      efficiency: {
        processingTimes: [],
        throughput: [],
        running: 0,
        count: 0
      },
      scalability: {
        loadTests: [],
        responseTime: [],
        running: 0,
        count: 0
      }
    }
    this.benchmarks = {
      accuracy: { target: 95, excellent: 98, good: 90, warning: 85 },
      efficiency: { target: 85, excellent: 95, good: 80, warning: 70 },
      scalability: { target: 90, excellent: 95, good: 85, warning: 75 }
    }
  }

  /**
   * Track ML prediction accuracy
   * @param {number} predicted - Predicted value
   * @param {number} actual - Actual measured value
   * @param {string} parameter - Parameter type (ph, tds, orp, turbidity)
   */
  trackAccuracy(predicted, actual, parameter = 'general') {
    const error = Math.abs(predicted - actual)
    const relativeError = (error / actual) * 100
    const accuracy = Math.max(0, 100 - relativeError)
    
    this.metrics.accuracy.predictions.push({
      predicted,
      actual,
      parameter,
      accuracy,
      timestamp: Date.now()
    })
    
    // Update running average
    this.metrics.accuracy.count++
    this.metrics.accuracy.running = (
      (this.metrics.accuracy.running * (this.metrics.accuracy.count - 1) + accuracy) /
      this.metrics.accuracy.count
    )
    
    // Keep only last 1000 measurements
    if (this.metrics.accuracy.predictions.length > 1000) {
      this.metrics.accuracy.predictions.shift()
    }
    
    return accuracy
  }

  /**
   * Track system efficiency metrics
   * @param {number} processingTime - Time taken to process request (ms)
   * @param {number} throughput - Data throughput (L/min)
   * @param {number} cpuUsage - CPU usage percentage
   */
  trackEfficiency(processingTime, throughput, cpuUsage = 0) {
    // Calculate efficiency score based on processing time and throughput
    const timeEfficiency = Math.max(0, 100 - (processingTime / 1000) * 10) // Penalize slow processing
    const throughputEfficiency = Math.min(100, (throughput / 20) * 100) // Target 20 L/min
    const cpuEfficiency = Math.max(0, 100 - cpuUsage)
    
    const efficiency = (timeEfficiency + throughputEfficiency + cpuEfficiency) / 3
    
    this.metrics.efficiency.processingTimes.push({
      processingTime,
      throughput,
      cpuUsage,
      efficiency,
      timestamp: Date.now()
    })
    
    // Update running average
    this.metrics.efficiency.count++
    this.metrics.efficiency.running = (
      (this.metrics.efficiency.running * (this.metrics.efficiency.count - 1) + efficiency) /
      this.metrics.efficiency.count
    )
    
    // Keep only last 1000 measurements
    if (this.metrics.efficiency.processingTimes.length > 1000) {
      this.metrics.efficiency.processingTimes.shift()
    }
    
    return efficiency
  }

  /**
   * Track system scalability metrics
   * @param {number} concurrentUsers - Number of concurrent connections
   * @param {number} responseTime - Average response time (ms)
   * @param {number} systemLoad - System load percentage
   */
  trackScalability(concurrentUsers, responseTime, systemLoad) {
    // Calculate scalability score
    const userScalability = Math.min(100, (concurrentUsers / 100) * 100) // Target 100 users
    const responseScalability = Math.max(0, 100 - (responseTime / 1000) * 50) // Penalize slow response
    const loadScalability = Math.max(0, 100 - systemLoad)
    
    const scalability = (userScalability + responseScalability + loadScalability) / 3
    
    this.metrics.scalability.loadTests.push({
      concurrentUsers,
      responseTime,
      systemLoad,
      scalability,
      timestamp: Date.now()
    })
    
    // Update running average
    this.metrics.scalability.count++
    this.metrics.scalability.running = (
      (this.metrics.scalability.running * (this.metrics.scalability.count - 1) + scalability) /
      this.metrics.scalability.count
    )
    
    // Keep only last 1000 measurements
    if (this.metrics.scalability.loadTests.length > 1000) {
      this.metrics.scalability.loadTests.shift()
    }
    
    return scalability
  }

  /**
   * Get current performance metrics
   * @returns {Object} Current metrics summary
   */
  getCurrentMetrics() {
    return {
      accuracy: {
        current: this.metrics.accuracy.running,
        level: this.getPerformanceLevel('accuracy', this.metrics.accuracy.running),
        trend: this.getTrend('accuracy'),
        lastUpdated: this.getLastUpdate('accuracy')
      },
      efficiency: {
        current: this.metrics.efficiency.running,
        level: this.getPerformanceLevel('efficiency', this.metrics.efficiency.running),
        trend: this.getTrend('efficiency'),
        lastUpdated: this.getLastUpdate('efficiency')
      },
      scalability: {
        current: this.metrics.scalability.running,
        level: this.getPerformanceLevel('scalability', this.metrics.scalability.running),
        trend: this.getTrend('scalability'),
        lastUpdated: this.getLastUpdate('scalability')
      }
    }
  }

  /**
   * Get performance level (excellent, good, warning, critical)
   * @param {string} metric - Metric type
   * @param {number} value - Current value
   * @returns {string} Performance level
   */
  getPerformanceLevel(metric, value) {
    const benchmarks = this.benchmarks[metric]
    if (!benchmarks) return 'unknown'
    
    if (value >= benchmarks.excellent) return 'excellent'
    if (value >= benchmarks.good) return 'good'
    if (value >= benchmarks.warning) return 'warning'
    return 'critical'
  }

  /**
   * Get performance trend (up, down, stable)
   * @param {string} metric - Metric type
   * @returns {string} Trend direction
   */
  getTrend(metric) {
    const data = this.metrics[metric]
    let values = []
    
    if (metric === 'accuracy') {
      values = data.predictions.slice(-10).map(p => p.accuracy)
    } else if (metric === 'efficiency') {
      values = data.processingTimes.slice(-10).map(p => p.efficiency)
    } else if (metric === 'scalability') {
      values = data.loadTests.slice(-10).map(p => p.scalability)
    }
    
    if (values.length < 2) return 'stable'
    
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3
    const older = values.slice(-10, -3).reduce((a, b) => a + b, 0) / 7
    
    if (recent > older + 2) return 'up'
    if (recent < older - 2) return 'down'
    return 'stable'
  }

  /**
   * Get last update timestamp for a metric
   * @param {string} metric - Metric type
   * @returns {number} Last update timestamp
   */
  getLastUpdate(metric) {
    const data = this.metrics[metric]
    if (metric === 'accuracy' && data.predictions.length > 0) {
      return data.predictions[data.predictions.length - 1].timestamp
    }
    if (metric === 'efficiency' && data.processingTimes.length > 0) {
      return data.processingTimes[data.processingTimes.length - 1].timestamp
    }
    if (metric === 'scalability' && data.loadTests.length > 0) {
      return data.loadTests[data.loadTests.length - 1].timestamp
    }
    return Date.now()
  }

  /**
   * Generate performance report
   * @param {string} timeframe - Timeframe for report (1h, 24h, 7d, 30d)
   * @returns {Object} Performance report
   */
  generateReport(timeframe = '24h') {
    const now = Date.now()
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }
    
    const cutoff = now - timeframes[timeframe]
    
    const report = {
      timeframe,
      generatedAt: now,
      accuracy: this.getMetricReport('accuracy', cutoff),
      efficiency: this.getMetricReport('efficiency', cutoff),
      scalability: this.getMetricReport('scalability', cutoff),
      overall: 0
    }
    
    // Calculate overall performance score
    report.overall = (
      report.accuracy.average +
      report.efficiency.average +
      report.scalability.average
    ) / 3
    
    return report
  }

  /**
   * Get detailed metric report
   * @param {string} metric - Metric type
   * @param {number} cutoff - Cutoff timestamp
   * @returns {Object} Metric report
   */
  getMetricReport(metric, cutoff) {
    const data = this.metrics[metric]
    let filteredData = []
    
    if (metric === 'accuracy') {
      filteredData = data.predictions.filter(p => p.timestamp >= cutoff)
    } else if (metric === 'efficiency') {
      filteredData = data.processingTimes.filter(p => p.timestamp >= cutoff)
    } else if (metric === 'scalability') {
      filteredData = data.loadTests.filter(p => p.timestamp >= cutoff)
    }
    
    if (filteredData.length === 0) {
      return {
        average: data.running,
        min: data.running,
        max: data.running,
        count: 0,
        trend: 'stable'
      }
    }
    
    const values = filteredData.map(d => 
      metric === 'accuracy' ? d.accuracy :
      metric === 'efficiency' ? d.efficiency :
      d.scalability
    )
    
    return {
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      trend: this.getTrend(metric)
    }
  }

  /**
   * Simulate realistic performance metrics for demo
   * @returns {Object} Simulated metrics
   */
  simulateMetrics() {
    const now = Date.now()
    
    // Simulate accuracy data
    const basePrediction = 7.2
    const baseActual = 7.1 + (Math.random() - 0.5) * 0.2
    this.trackAccuracy(basePrediction, baseActual, 'ph')
    
    // Simulate efficiency data
    const processingTime = 500 + Math.random() * 200
    const throughput = 15 + Math.random() * 5
    const cpuUsage = 40 + Math.random() * 20
    this.trackEfficiency(processingTime, throughput, cpuUsage)
    
    // Simulate scalability data
    const concurrentUsers = 10 + Math.random() * 20
    const responseTime = 200 + Math.random() * 100
    const systemLoad = 30 + Math.random() * 30
    this.trackScalability(concurrentUsers, responseTime, systemLoad)
    
    return this.getCurrentMetrics()
  }

  /**
   * Export metrics data
   * @returns {Object} Exported metrics
   */
  exportMetrics() {
    return {
      metrics: this.metrics,
      benchmarks: this.benchmarks,
      exportedAt: Date.now()
    }
  }

  /**
   * Import metrics data
   * @param {Object} data - Imported metrics data
   */
  importMetrics(data) {
    if (data.metrics) {
      this.metrics = data.metrics
    }
    if (data.benchmarks) {
      this.benchmarks = data.benchmarks
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      accuracy: {
        predictions: [],
        actualResults: [],
        running: 0,
        count: 0
      },
      efficiency: {
        processingTimes: [],
        throughput: [],
        running: 0,
        count: 0
      },
      scalability: {
        loadTests: [],
        responseTime: [],
        running: 0,
        count: 0
      }
    }
  }
}

// Create singleton instance
const performanceMetrics = new PerformanceMetrics()

// Auto-simulation for demo purposes
let simulationInterval
export const startSimulation = () => {
  if (simulationInterval) clearInterval(simulationInterval)
  simulationInterval = setInterval(() => {
    performanceMetrics.simulateMetrics()
  }, 5000) // Update every 5 seconds
}

export const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
}

// Performance testing utilities
export const performanceTestUtils = {
  /**
   * Test ML model accuracy
   * @param {Function} model - ML model function
   * @param {Array} testData - Test dataset
   * @returns {Object} Accuracy results
   */
  testModelAccuracy: async (model, testData) => {
    const results = []
    
    for (const test of testData) {
      const startTime = performance.now()
      const prediction = await model(test.input)
      const endTime = performance.now()
      
      const accuracy = performanceMetrics.trackAccuracy(
        prediction.value,
        test.expected,
        test.parameter
      )
      
      results.push({
        input: test.input,
        expected: test.expected,
        predicted: prediction.value,
        accuracy,
        processingTime: endTime - startTime
      })
    }
    
    return {
      totalTests: results.length,
      averageAccuracy: results.reduce((sum, r) => sum + r.accuracy, 0) / results.length,
      averageProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length,
      results
    }
  },

  /**
   * Test system efficiency under load
   * @param {number} duration - Test duration in seconds
   * @param {number} requestRate - Requests per second
   * @returns {Object} Efficiency results
   */
  testSystemEfficiency: async (duration = 60, requestRate = 10) => {
    const results = []
    const startTime = Date.now()
    const endTime = startTime + duration * 1000
    
    while (Date.now() < endTime) {
      const requestStart = performance.now()
      
      // Simulate API request
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100))
      
      const requestEnd = performance.now()
      const processingTime = requestEnd - requestStart
      
      const efficiency = performanceMetrics.trackEfficiency(
        processingTime,
        15 + Math.random() * 5,
        40 + Math.random() * 20
      )
      
      results.push({
        timestamp: Date.now(),
        processingTime,
        efficiency
      })
      
      // Wait for next request
      await new Promise(resolve => setTimeout(resolve, 1000 / requestRate))
    }
    
    return {
      duration,
      requestRate,
      totalRequests: results.length,
      averageEfficiency: results.reduce((sum, r) => sum + r.efficiency, 0) / results.length,
      averageProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length,
      results
    }
  },

  /**
   * Test system scalability
   * @param {Array} userCounts - Array of user counts to test
   * @returns {Object} Scalability results
   */
  testSystemScalability: async (userCounts = [1, 5, 10, 25, 50, 100]) => {
    const results = []
    
    for (const userCount of userCounts) {
      const testStart = performance.now()
      
      // Simulate concurrent users
      const promises = Array(userCount).fill().map(async () => {
        const requestStart = performance.now()
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
        return performance.now() - requestStart
      })
      
      const responseTimes = await Promise.all(promises)
      const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      
      const scalability = performanceMetrics.trackScalability(
        userCount,
        averageResponseTime,
        Math.min(100, userCount * 2) // Simulate system load
      )
      
      results.push({
        userCount,
        averageResponseTime,
        scalability,
        duration: performance.now() - testStart
      })
    }
    
    return {
      userCounts,
      results,
      maxUsers: Math.max(...userCounts),
      bestScalability: Math.max(...results.map(r => r.scalability))
    }
  }
}

export { performanceMetrics }
export default performanceMetrics 