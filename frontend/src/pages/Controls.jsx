import React, { useState } from 'react'
import { useApi } from '../contexts/ApiContext'
import { Play, Square, RotateCcw, ArrowUp, ArrowDown, MapPin, AlertTriangle } from 'lucide-react'

const Controls = () => {
  const { executeControl, emergencyStop } = useApi()
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  const handleControl = async (commandType, command, options = {}) => {
    setLoading(true)
    try {
      const result = await executeControl(commandType, command, options)
      setLastResult(result)
    } catch (error) {
      setLastResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const ControlButton = ({ onClick, icon: Icon, label, description, variant = 'primary', disabled = false }) => {
    const getStyles = () => {
      const baseStyles = "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 min-h-[120px]"
      
      if (disabled) {
        return `${baseStyles} bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed`
      }

      switch (variant) {
        case 'primary':
          return `${baseStyles} bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md`
        case 'success':
          return `${baseStyles} bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 hover:shadow-md`
        case 'warning':
          return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300 hover:shadow-md`
        case 'danger':
          return `${baseStyles} bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:shadow-md`
        default:
          return `${baseStyles} bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 hover:shadow-md`
      }
    }

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={getStyles()}
      >
        <Icon size={32} className="mb-3" />
        <span className="font-semibold text-sm">{label}</span>
        <span className="text-xs text-center mt-1 opacity-80">{description}</span>
      </button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          System Controls
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manual control of water purification system components
        </p>
      </div>

      {/* Emergency Controls */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4 flex items-center">
          <AlertTriangle size={20} className="mr-2" />
          Emergency Controls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ControlButton
            onClick={() => handleControl('emergency', 'stop')}
            icon={Square}
            label="Emergency Stop"
            description="Immediately stop all operations"
            variant="danger"
          />
          <ControlButton
            onClick={() => handleControl('valve', 'C')}
            icon={Square}
            label="Close All Valves"
            description="Safety closure of all valves"
            variant="danger"
          />
        </div>
      </div>

      {/* Valve Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Valve Controls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ControlButton
            onClick={() => handleControl('valve', '0')}
            icon={Play}
            label="Open Valve"
            description="Allow water flow"
            variant="success"
          />
          <ControlButton
            onClick={() => handleControl('valve', 'C')}
            icon={Square}
            label="Close Valve"
            description="Stop water flow"
            variant="warning"
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filter Controls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ControlButton
            onClick={() => handleControl('filter', 'r')}
            icon={RotateCcw}
            label="Rotate Filter"
            description="Replace filter cartridge"
            variant="primary"
          />
          <ControlButton
            onClick={() => handleControl('filter', 'f')}
            icon={ArrowUp}
            label="Move Forward"
            description="Advance filter position"
            variant="primary"
          />
          <ControlButton
            onClick={() => handleControl('filter', 'b')}
            icon={ArrowDown}
            label="Move Backward"
            description="Retract filter position"
            variant="primary"
          />
        </div>
      </div>

      {/* Drone Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Emergency Delivery System
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ControlButton
              onClick={() => handleControl('drone', 'dispatch', { 
                latitude: 40.7128, 
                longitude: -74.0060 
              })}
              icon={MapPin}
              label="Dispatch to NYC"
              description="Emergency supply delivery"
              variant="warning"
            />
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Custom Coordinates
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Latitude"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                step="any"
              />
              <input
                type="number"
                placeholder="Longitude"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                step="any"
              />
            </div>
            <button className="w-full btn-primary text-sm py-2">
              Dispatch to Custom Location
            </button>
          </div>
        </div>
      </div>

      {/* Control Result Display */}
      {lastResult && (
        <div className={`rounded-xl p-4 ${
          lastResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <h3 className={`font-medium ${
            lastResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
          }`}>
            {lastResult.success ? '✅ Command Successful' : '❌ Command Failed'}
          </h3>
          <pre className={`text-sm mt-2 ${
            lastResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
          }`}>
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default Controls 