import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Heart, Users, Droplets, Globe, Target, Award, MapPin } from 'lucide-react'

const About = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const collaborations = [
    {
      name: 'Paani Foundation',
      description: 'Working towards water abundance in Maharashtra through village-level water management programs.',
      image: 'https://en.wikipedia.org/wiki/Paani_Foundation#/media/File:Paani_Logo_Marathi_Logo.png',
      focus: 'Water Conservation',
      location: 'Maharashtra, India',
      website: 'https://paanifoundation.in/',
      impact: 'Transformed 1,000+ villages with water security solutions'
    },
    {
      name: 'Apnalaya',
      description: 'Empowering urban slum communities in Mumbai with sustainable water access and sanitation solutions.',
      image: 'https://apnalaya.org/wp-content/uploads/2020/01/logo-e1584007155896.png',
      focus: 'Urban Water Access',
      location: 'Mumbai, India',
      website: 'https://apnalaya.org/',
      impact: 'Serving 500,000+ people in Mumbai slums'
    },
    {
      name: 'Water Aid India',
      description: 'Ensuring clean water, decent toilets, and good hygiene for everyone, everywhere within a generation.',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp3l03L3AOjrPCpOpbTOR-1tHhAn9E8wdCCw&s',
      focus: 'Clean Water Access',
      location: 'Mumbai & Beyond',
      website: 'https://www.wateraid.org/in/',
      impact: 'Reaching 2.5 million people across India'
    }
  ]

  const futureGoals = [
    {
      icon: <Droplets className="h-8 w-8 text-blue-500" />,
      title: 'Smart Water Networks',
      description: 'Deploy IoT sensors across Mumbai\'s water distribution network to monitor quality and detect leaks in real-time.',
      timeline: '2024-2025'
    },
    {
      icon: <Users className="h-8 w-8 text-green-500" />,
      title: 'Community Empowerment',
      description: 'Train local communities to maintain water monitoring systems and respond to quality issues independently.',
      timeline: '2024-2026'
    },
    {
      icon: <Globe className="h-8 w-8 text-purple-500" />,
      title: 'Regional Expansion',
      description: 'Scale AquaSentinel technology to rural Maharashtra and other Indian states facing water challenges.',
      timeline: '2025-2027'
    },
    {
      icon: <Award className="h-8 w-8 text-orange-500" />,
      title: 'Research Partnership',
      description: 'Collaborate with IIT Bombay and TISS Mumbai on water quality research and policy recommendations.',
      timeline: '2024-2025'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <div className="relative bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </button>
            
            {currentUser && (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            About AquaSentinel
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Collaborating for Water Security in Mumbai
          </p>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            AquaSentinel is committed to ensuring clean, safe water for all. Through strategic partnerships 
            with Mumbai's leading NGOs, we're building a sustainable future where water quality monitoring 
            and community empowerment go hand in hand.
          </p>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
            <div className="flex items-center space-x-4 mb-6">
              <Heart className="h-8 w-8 text-red-400" />
              <h2 className="text-3xl font-bold text-white">Our Mission</h2>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed">
              To democratize access to clean water through innovative technology and meaningful partnerships. 
              We believe that every community deserves real-time insights into their water quality, and we're 
              working with Mumbai's most impactful NGOs to make this vision a reality.
            </p>
          </div>
        </div>
      </div>

      {/* NGO Collaborations */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Our NGO Partners
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Working together with Mumbai's leading organizations to create lasting impact
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collaborations.map((collab, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                    <img 
                      src={collab.image} 
                      alt={collab.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = `<div class="text-2xl font-bold text-gray-700">${collab.name.charAt(0)}</div>`
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{collab.name}</h3>
                    <div className="flex items-center space-x-1 text-sm text-cyan-400">
                      <MapPin className="h-4 w-4" />
                      <span>{collab.location}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                  {collab.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-400">Focus Area:</span>
                    <span className="text-sm text-cyan-400">{collab.focus}</span>
                  </div>
                  <div className="text-sm text-gray-400 bg-blue-500/10 rounded-lg p-2">
                    <strong>Impact:</strong> {collab.impact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Future Goals */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Future Collaboration Goals
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Our roadmap for scaling water intelligence across Mumbai and beyond
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {futureGoals.map((goal, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                    {goal.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-white">{goal.title}</h3>
                      <span className="text-sm text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                        {goal.timeline}
                      </span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {goal.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-lg rounded-2xl p-8 border border-cyan-500/20">
            <Target className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Join Our Mission
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Whether you're an NGO, researcher, or community leader, we'd love to collaborate 
              on making water security a reality for all.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/signup')}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
              >
                Get Started
              </button>
              <button 
                onClick={() => navigate('/')}
                className="px-8 py-3 border-2 border-cyan-500/50 text-cyan-300 font-semibold rounded-lg hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-200"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black/20 backdrop-blur-lg border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2024 AquaSentinel. Building a sustainable water future for Mumbai and beyond.
          </p>
        </div>
      </div>
    </div>
  )
}

export default About 