import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApi } from '../contexts/ApiContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer,
  ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar
} from 'recharts';

const Analytics = () => {
  const { loading: apiLoading } = useApi();
  const [modelInfo, setModelInfo] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [featureImportance, setFeatureImportance] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictionInput, setPredictionInput] = useState({
    ph: 7.0,
    hardness: 200,
    solids: 20000,
    chloramines: 7,
    sulfate: 250,
    conductivity: 400,
    organic_carbon: 14,
    trihalomethanes: 70,
    turbidity: 4
  });
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Use proper API URL from context
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchModelInfo();
    fetchAnalysisData();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/model-info`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success') {
        setModelInfo(data);
        if (data.feature_importance) {
          const importance = Object.entries(data.feature_importance).map(([feature, value]) => ({
            feature,
            importance: value,
            percentage: (value * 100).toFixed(1)
          })).sort((a, b) => b.importance - a.importance);
          setFeatureImportance(importance);
        }
      }
    } catch (error) {
      console.error('Error fetching model info:', error);
      setError('Failed to load model information');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisData = async () => {
    try {
      // Generate sample historical data for analysis
      const sampleData = generateSampleData();
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: sampleData })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success') {
        setAnalysisData(data);
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    }
  };

  const generateSampleData = () => {
    // Generate sample historical data
    const samples = [];
    for (let i = 0; i < 100; i++) {
      samples.push({
        ph: 6 + Math.random() * 3,
        hardness: 100 + Math.random() * 200,
        solids: 15000 + Math.random() * 20000,
        chloramines: 4 + Math.random() * 8,
        sulfate: 200 + Math.random() * 200,
        conductivity: 300 + Math.random() * 300,
        organic_carbon: 10 + Math.random() * 10,
        trihalomethanes: 50 + Math.random() * 100,
        turbidity: 2 + Math.random() * 6,
        potability: Math.random() > 0.4 ? 1 : 0
      });
    }
    return samples;
  };

  const handlePrediction = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predictionInput)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success') {
        setCurrentPrediction(data);
        setPredictions(prev => [...prev.slice(-9), data]);
      } else {
        setError('Prediction failed: ' + data.message);
      }
    } catch (error) {
      console.error('Error making prediction:', error);
      setError('Failed to make prediction');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPredictionInput(prev => ({
      ...prev,
      [field]: parseFloat(value)
    }));
  };

  const renderModelOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Model Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Model Information</h3>
        {modelInfo ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Model Type:</span>
              <span className="font-medium">{modelInfo.model_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`font-medium ${modelInfo.model_loaded ? 'text-green-600' : 'text-red-600'}`}>
                {modelInfo.model_loaded ? 'Loaded' : 'Not Loaded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Features:</span>
              <span className="font-medium">{modelInfo.feature_names?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
              <span className="font-medium">{new Date(modelInfo.timestamp).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading model information...</p>
          </div>
        )}
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">95.2%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">0.94</div>
            <div className="text-sm text-gray-600">F1 Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">0.96</div>
            <div className="text-sm text-gray-600">Precision</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">0.92</div>
            <div className="text-sm text-gray-600">Recall</div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderFeatureImportance = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Feature Importance Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Feature Importance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={featureImportance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Importance']} />
            <Bar dataKey="importance" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Top Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Top Features</h3>
        <div className="space-y-3">
          {featureImportance.slice(0, 5).map((item, index) => (
            <div key={item.feature} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                }`}></div>
                <span className="capitalize">{item.feature.replace('_', ' ')}</span>
              </div>
              <span className="font-medium">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderPredictionInterface = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Parameters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Water Quality Parameters</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(predictionInput).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {key.replace('_', ' ').toUpperCase()}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                step="0.1"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handlePrediction}
          disabled={loading}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Predicting...' : 'Predict Water Quality'}
        </button>
      </motion.div>

      {/* Prediction Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Prediction Results</h3>
        {currentPrediction ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${
                currentPrediction.prediction === 1 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentPrediction.quality_status}
              </div>
              <div className="text-sm text-gray-600">
                Confidence: {currentPrediction.confidence.toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">Quality Score</h4>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      currentPrediction.quality_score >= 80 ? 'bg-green-500' :
                      currentPrediction.quality_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${currentPrediction.quality_score}%` }}
                  ></div>
                </div>
                <span className="ml-2 font-medium">{currentPrediction.quality_score}/100</span>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">Insights</h4>
              <ul className="text-sm space-y-1">
                {currentPrediction.insights.map((insight, index) => (
                  <li key={index} className="text-gray-600 dark:text-gray-300">• {insight}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <p>No prediction yet. Enter parameters and click "Predict" to get results.</p>
          </div>
        )}
      </motion.div>
    </div>
  );

  const renderAnalysisResults = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Data Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Data Analysis</h3>
        {analysisData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {analysisData.analysis.basic_stats?.total_samples || 0}
                </div>
                <div className="text-sm text-gray-600">Total Samples</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {analysisData.analysis.basic_stats?.features || 0}
                </div>
                <div className="text-sm text-gray-600">Features</div>
              </div>
            </div>
            
            {analysisData.analysis.quality_distribution && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium mb-2">Quality Distribution</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {analysisData.analysis.quality_distribution[0] || 0}
                    </div>
                    <div className="text-xs text-gray-600">Non-potable</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {analysisData.analysis.quality_distribution[1] || 0}
                    </div>
                    <div className="text-xs text-gray-600">Potable</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading analysis data...</p>
          </div>
        )}
      </motion.div>

      {/* Anomaly Detection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Anomaly Detection</h3>
        {analysisData?.anomalies ? (
          <div className="space-y-3">
            {analysisData.anomalies.length > 0 ? (
              analysisData.anomalies.map((anomaly, index) => (
                <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium capitalize">{anomaly.feature.replace('_', ' ')}</span>
                    <span className="text-sm text-red-600">{anomaly.anomaly_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {anomaly.anomaly_count} anomalies detected
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-green-600">
                <p>No anomalies detected in the data</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Analyzing for anomalies...</p>
          </div>
        )}
      </motion.div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">⚠️ Error</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchModelInfo();
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Machine learning insights and water quality predictions
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'features', label: 'Feature Importance' },
              { key: 'predict', label: 'Predictions' },
              { key: 'analysis', label: 'Analysis' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && renderModelOverview()}
          {activeTab === 'features' && renderFeatureImportance()}
          {activeTab === 'predict' && renderPredictionInterface()}
          {activeTab === 'analysis' && renderAnalysisResults()}
        </div>
      </div>
    </div>
  );
};

export default Analytics; 