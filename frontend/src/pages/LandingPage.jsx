import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Don't redirect if user is logged in - show welcome message instead
  // useEffect(() => {
  //   if (currentUser) {
  //     navigate('/dashboard')
  //   }
  // }, [currentUser, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Background Video/Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-cyan-900/20 to-slate-900/20"></div>
        
        {/* Animated water ripples */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-gradient-to-r from-cyan-400/10 to-blue-600/10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400/30 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                AquaSentinel
              </h1>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <button 
                onClick={() => navigate('/about')}
                className="text-gray-300 hover:text-white transition-colors"
              >
                About
              </button>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {currentUser ? (
                <>
                  <span className="text-gray-300">
                    Welcome, {currentUser.displayName || currentUser.email.split('@')[0]}
                  </span>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Dashboard
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/40 backdrop-blur-lg border-t border-white/10">
            <div className="px-4 py-2 space-y-2">
              <a href="#features" className="block py-2 text-gray-300 hover:text-white">Features</a>
              <button 
                onClick={() => navigate('/about')}
                className="block w-full text-left py-2 text-gray-300 hover:text-white"
              >
                About
              </button>
              <a href="#contact" className="block py-2 text-gray-300 hover:text-white">Contact</a>
              <div className="pt-2 border-t border-white/10">
                {currentUser ? (
                  <>
                    <span className="block py-2 text-gray-300">
                      Welcome, {currentUser.displayName || currentUser.email.split('@')[0]}
                    </span>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="block w-full text-left py-2 text-cyan-400 hover:text-cyan-300"
                    >
                      Dashboard
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="block w-full text-left py-2 text-gray-300 hover:text-white"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => navigate('/signup')}
                      className="block w-full text-left py-2 text-cyan-400 hover:text-cyan-300"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          >
            AquaSentinel
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            AI-Powered Water Intelligence Platform
          </p>
          
          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Real-time monitoring, predictive analytics, and intelligent automation for 
            water quality management systems. Ensuring clean, safe water through 
            advanced IoT sensors and machine learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {currentUser ? (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-semibold text-cyan-300 mb-2">
                    Welcome back, {currentUser.displayName || currentUser.email.split('@')[0]}!
                  </h3>
                  <p className="text-gray-400">
                    Ready to monitor your water systems?
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25"
                >
                  Launch Dashboard →
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25"
                >
                  Get Started →
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 border-2 border-cyan-500/50 text-cyan-300 font-semibold rounded-xl hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-300"
                >
                  Launch Dashboard
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Advanced Water Monitoring Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🌊",
                title: "Real-time Monitoring",
                description: "24/7 water quality tracking with instant alerts and notifications"
              },
              {
                icon: "🧠",
                title: "AI Analytics",
                description: "Machine learning predictions for water quality optimization"
              },
              {
                icon: "📊",
                title: "Smart Dashboard",
                description: "Comprehensive analytics and visualization tools"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-cyan-500/50"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-4 text-cyan-300">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/20 backdrop-blur-lg border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
              AquaSentinel
            </h3>
            <p className="text-gray-400 mb-8">
              Advanced water intelligence for a sustainable future
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 