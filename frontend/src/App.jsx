import React, { useState, useEffect } from 'react'

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Track mouse movement for custom effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Create massive particle explosion effect
  const createExplosion = (e) => {
    const rect = e.target.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const newParticles = []
    // Create WAY more particles for bigger explosions
    for (let i = 0; i < 25; i++) {
      newParticles.push({
        id: Math.random(),
        x: centerX,
        y: centerY,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1,
        size: Math.random() * 6 + 2,
        color: Math.random() > 0.5 ? '#06b6d4' : '#67e8f9'
      })
    }
    setParticles(prev => [...prev, ...newParticles])
    
    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.includes(p)))
    }, 1500)
  }

  const styles = {
    // Global styles
    '*': {
      margin: 0,
      padding: 0,
      boxSizing: 'border-box'
    },
    
    container: {
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#ffffff',
      fontFamily: '"Orbitron", "Exo 2", system-ui, -apple-system, sans-serif',
      lineHeight: 1.6,
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden'
    },

    // Custom arrow cursor
    customCursor: {
      position: 'fixed',
      top: mousePosition.y,
      left: mousePosition.x,
      width: '0',
      height: '0',
      pointerEvents: 'none',
      zIndex: 9999,
      borderLeft: '12px solid #06b6d4',
      borderTop: '8px solid transparent',
      borderBottom: '8px solid transparent',
      transform: 'rotate(-45deg)',
      filter: 'drop-shadow(0 0 8px #06b6d4)',
      transition: 'all 0.1s ease'
    },

    // Enhanced particle system
    particle: {
      position: 'fixed',
      background: '#06b6d4',
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: 1000
    },

    // Navigation
    navbar: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '20px 40px',
      background: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(20px)',
      border: 'none'
    },

    navContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: '1400px',
      margin: '0 auto'
    },

    logo: {
      fontSize: '1.8rem',
      fontWeight: '900',
      color: '#06b6d4',
      fontFamily: '"Orbitron", monospace',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },

    navLinks: {
      display: 'flex',
      gap: '40px',
      listStyle: 'none'
    },

    navLink: {
      color: '#ffffff',
      textDecoration: 'none',
      fontSize: '0.95rem',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      fontFamily: '"Exo 2", sans-serif',
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },

    contactBtn: {
      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '25px',
      textDecoration: 'none',
      fontSize: '0.95rem',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      border: 'none',
      cursor: 'pointer',
      fontFamily: '"Exo 2", sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)'
    },

    // Hero section
    hero: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      background: `linear-gradient(rgba(10, 10, 10, 0.6), rgba(6, 182, 212, 0.1)), url('https://www.wychwood-water.com/wp-content/uploads/2021/12/water-background-with-bubbles-scaled.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      paddingTop: '80px'
    },

    heroContent: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0 40px'
    },

    heroTitle: {
      fontSize: '4.5rem',
      fontWeight: '900',
      marginBottom: '24px',
      background: 'linear-gradient(135deg, #ffffff 0%, #06b6d4 50%, #0891b2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: 'none',
      fontFamily: '"Orbitron", monospace',
      textTransform: 'uppercase',
      letterSpacing: '3px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },

    heroSubtitle: {
      fontSize: '1.8rem',
      color: '#06b6d4',
      fontWeight: '600',
      marginBottom: '32px',
      textShadow: 'none',
      fontFamily: '"Exo 2", sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },

    heroDescription: {
      fontSize: '1.25rem',
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: '48px',
      lineHeight: 1.6,
      textShadow: 'none',
      fontFamily: '"Exo 2", sans-serif',
      fontWeight: '300'
    },

    // Live time display
    liveTimeCard: {
      background: 'rgba(6, 182, 212, 0.15)',
      backdropFilter: 'blur(20px)',
      border: 'none',
      borderRadius: '20px',
      padding: '24px',
      margin: '48px auto',
      maxWidth: '300px',
      textAlign: 'center',
      boxShadow: '0 8px 32px rgba(6, 182, 212, 0.2)',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },

    liveTime: {
      fontSize: '2rem',
      fontWeight: 'bold',
      fontFamily: '"Orbitron", monospace',
      color: '#06b6d4',
      marginBottom: '8px',
      letterSpacing: '2px'
    },

    timeLabel: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '0.9rem',
      fontFamily: '"Exo 2", sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },

    // Services section
    section: {
      padding: '120px 40px',
      maxWidth: '1400px',
      margin: '0 auto'
    },

    sectionTitle: {
      fontSize: '3.5rem',
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: '24px',
      color: '#ffffff',
      fontFamily: '"Orbitron", monospace',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },

    sectionSubtitle: {
      fontSize: '1.25rem',
      textAlign: 'center',
      color: 'rgba(255, 255, 255, 0.7)',
      marginBottom: '80px',
      maxWidth: '600px',
      margin: '0 auto 80px',
      fontFamily: '"Exo 2", sans-serif',
      fontWeight: '300'
    },

    servicesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '40px',
      marginBottom: '80px'
    },

    serviceCard: {
      background: 'rgba(255, 255, 255, 0.02)',
      border: 'none',
      borderRadius: '20px',
      padding: '40px',
      transition: 'all 0.4s ease',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    },

    serviceIcon: {
      fontSize: '4rem',
      marginBottom: '24px',
      display: 'block',
      transition: 'all 0.3s ease'
    },

    serviceTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: '#06b6d4',
      fontFamily: '"Orbitron", monospace',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },

    serviceDescription: {
      color: 'rgba(255, 255, 255, 0.7)',
      lineHeight: 1.6,
      marginBottom: '24px',
      fontFamily: '"Exo 2", sans-serif',
      fontWeight: '300'
    },

    learnMoreBtn: {
      color: '#06b6d4',
      textDecoration: 'none',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      fontFamily: '"Exo 2", sans-serif',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },

    // Metrics section
    metricsSection: {
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '24px',
      padding: '60px',
      margin: '80px 0',
      border: 'none'
    },

    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '40px'
    },

    metricCard: {
      textAlign: 'center',
      padding: '24px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },

    metricValue: {
      fontSize: '3rem',
      fontWeight: 'bold',
      color: '#06b6d4',
      marginBottom: '8px',
      fontFamily: '"Orbitron", monospace',
      letterSpacing: '2px'
    },

    metricLabel: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: '1.1rem',
      fontFamily: '"Exo 2", sans-serif',
      fontWeight: '300'
    },

    // Case studies
    caseStudiesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '40px'
    },

    caseStudyCard: {
      background: 'rgba(255, 255, 255, 0.02)',
      border: 'none',
      borderRadius: '20px',
      overflow: 'hidden',
      transition: 'all 0.4s ease',
      cursor: 'pointer'
    },

    caseStudyImage: {
      width: '100%',
      height: '250px',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative'
    },

    caseStudyImageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, rgba(6, 182, 212, 0.2) 0%, rgba(8, 145, 178, 0.2) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '3rem',
      color: 'white',
      opacity: 0,
      transition: 'opacity 0.3s ease'
    },

    caseStudyContent: {
      padding: '32px'
    },

    caseStudyTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      marginBottom: '12px',
      color: '#ffffff',
      fontFamily: '"Orbitron", monospace',
      textTransform: 'uppercase',
      letterSpacing: '1px'
    },

    caseStudyMeta: {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '0.9rem',
      marginBottom: '16px',
      fontFamily: '"Exo 2", sans-serif',
      fontWeight: '300'
    },

    // Client logos
    clientsSection: {
      textAlign: 'center',
      padding: '80px 0'
    },

    clientLogos: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '60px',
      flexWrap: 'wrap',
      marginTop: '40px'
    },

    clientLogo: {
      fontSize: '1.5rem',
      color: 'rgba(255, 255, 255, 0.4)',
      fontWeight: 'bold',
      padding: '16px 24px',
      border: 'none',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      background: 'rgba(255, 255, 255, 0.02)',
      fontFamily: '"Exo 2", sans-serif',
      cursor: 'pointer'
    },

    clientLogoImage: {
      height: '60px',
      width: 'auto',
      filter: 'brightness(0.7) contrast(1.2)',
      transition: 'all 0.3s ease',
      padding: '10px',
      cursor: 'pointer'
    },

    // Footer
    footer: {
      background: 'rgba(255, 255, 255, 0.02)',
      border: 'none',
      padding: '60px 40px 40px',
      textAlign: 'center'
    },

    footerContent: {
      maxWidth: '1400px',
      margin: '0 auto'
    }
  }

  // Add keyframes and Google Fonts
  useEffect(() => {
    // Add Google Fonts
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;500;600;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    const styleSheet = document.createElement('style')
    styleSheet.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.05); }
      }
      
      @keyframes explode {
        0% { transform: scale(1) rotate(0deg); opacity: 1; }
        100% { transform: scale(2) rotate(360deg); opacity: 0; }
      }
      
      @keyframes megaExplode {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.8; }
        100% { transform: scale(2.5); opacity: 0; }
      }
      
      @keyframes glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
      }
      
      @keyframes neon-glow {
        0%, 100% { text-shadow: 0 0 5px #06b6d4, 0 0 10px #06b6d4, 0 0 15px #06b6d4; }
        50% { text-shadow: 0 0 10px #06b6d4, 0 0 20px #06b6d4, 0 0 30px #06b6d4; }
      }
      
      .nav-link:hover {
        color: #06b6d4 !important;
        animation: neon-glow 0.5s ease-in-out;
      }
      
      .logo:hover {
        animation: glitch 0.5s ease-in-out;
        text-shadow: 0 0 20px #06b6d4;
      }
      
      .contact-btn:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 15px 35px rgba(6, 182, 212, 0.4);
        animation: pulse 1s infinite;
      }
      
      .hero-title:hover {
        animation: megaExplode 0.8s ease-out;
        text-shadow: 0 0 30px #06b6d4;
      }
      
      .hero-subtitle:hover {
        animation: glitch 0.4s ease-in-out;
      }
      
      .service-card:hover {
        background: rgba(6, 182, 212, 0.1) !important;
        transform: translateY(-10px) scale(1.02);
        box-shadow: 0 20px 40px rgba(6, 182, 212, 0.2);
      }
      
      .service-card:hover .service-icon {
        animation: megaExplode 1s ease-out;
      }
      
      .service-title:hover {
        animation: neon-glow 0.5s ease-in-out;
      }
      
      .case-study-card:hover {
        background: rgba(255, 255, 255, 0.05) !important;
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 25px 50px rgba(6, 182, 212, 0.2);
      }
      
      .case-study-card:hover .overlay {
        opacity: 1 !important;
      }
      
      .metric-card:hover {
        transform: scale(1.15);
        animation: pulse 0.8s ease-in-out;
      }
      
      .metric-value:hover {
        animation: megaExplode 0.8s ease-out;
      }
      
      .client-logo:hover, .client-logo-img:hover {
        filter: brightness(1) contrast(1) !important;
        transform: scale(1.15);
        box-shadow: 0 10px 25px rgba(6, 182, 212, 0.3);
      }
      
      .learn-more:hover {
        color: #67e8f9 !important;
        transform: translateX(10px) scale(1.1);
        animation: neon-glow 0.5s ease-in-out;
      }
      
      .live-time-card:hover {
        transform: scale(1.1);
        box-shadow: 0 15px 40px rgba(6, 182, 212, 0.4);
        animation: pulse 1s infinite;
      }
      
      .section-title:hover {
        animation: megaExplode 1s ease-out;
        text-shadow: 0 0 40px #06b6d4;
      }
      
      .particle-animation {
        animation: particle-float 1.5s ease-out forwards;
      }
      
      @keyframes particle-float {
        0% { transform: translate(0, 0) scale(1); opacity: 1; }
        100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
      }
    `
    document.head.appendChild(styleSheet)
    return () => {
      document.head.removeChild(styleSheet)
      if (document.head.contains(link)) document.head.removeChild(link)
    }
  }, [])

  return (
    <div style={styles.container}>
      {/* Custom Arrow Cursor */}
      <div style={styles.customCursor}></div>
      
      {/* Enhanced Particle System */}
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            ...styles.particle,
            left: particle.x,
            top: particle.y,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            '--dx': `${particle.vx * 30}px`,
            '--dy': `${particle.vy * 30}px`
          }}
          className="particle-animation"
        />
      ))}

      {/* Navigation */}
      <nav style={styles.navbar}>
        <div style={styles.navContent}>
          <div style={styles.logo} className="logo" onClick={createExplosion}>AquaSentinel</div>
          <ul style={styles.navLinks}>
            <li><a href="#services" style={styles.navLink} className="nav-link" onClick={createExplosion}>Services</a></li>
            <li><a href="#solutions" style={styles.navLink} className="nav-link" onClick={createExplosion}>Solutions</a></li>
            <li><a href="#case-studies" style={styles.navLink} className="nav-link" onClick={createExplosion}>Case Studies</a></li>
            <li><a href="#about" style={styles.navLink} className="nav-link" onClick={createExplosion}>About</a></li>
          </ul>
          <button style={styles.contactBtn} className="contact-btn" onClick={createExplosion}>Contact Us</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle} className="hero-title" onClick={createExplosion}>Future-focused team building</h1>
          <h2 style={styles.heroSubtitle} className="hero-subtitle" onClick={createExplosion}>intelligent water systems</h2>
          <p style={styles.heroDescription}>
            We're college students passionate about designing and developing AI-powered water monitoring solutions. 
            Our goal is to create systems that optimize quality, reduce costs, and ensure regulatory compliance.
          </p>
          
          <div style={styles.liveTimeCard} className="live-time-card" onClick={createExplosion}>
            <div style={styles.liveTime}>{currentTime.toLocaleTimeString()}</div>
            <div style={styles.timeLabel}>Live System Time</div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section style={styles.section} id="services">
        <h2 style={styles.sectionTitle} className="section-title" onClick={createExplosion}>Our vision for water intelligence,</h2>
        <p style={styles.sectionSubtitle}>from monitoring to automation.</p>
        
        <div style={styles.servicesGrid}>
          <div style={styles.serviceCard} className="service-card" onClick={createExplosion}>
            <span style={styles.serviceIcon} className="service-icon">🌊</span>
            <h3 style={styles.serviceTitle} className="service-title" onClick={createExplosion}>Real-time Monitoring</h3>
            <p style={styles.serviceDescription}>
              Planning to implement continuous monitoring of TDS, pH, ORP, and turbidity with instant alerts and automated responses.
            </p>
            <a href="#" style={styles.learnMoreBtn} className="learn-more" onClick={createExplosion}>Learn more →</a>
          </div>
          
          <div style={styles.serviceCard} className="service-card" onClick={createExplosion}>
            <span style={styles.serviceIcon} className="service-icon">🧠</span>
            <h3 style={styles.serviceTitle} className="service-title" onClick={createExplosion}>AI Predictions</h3>
            <p style={styles.serviceDescription}>
              Developing machine learning algorithms to predict maintenance needs, filter replacements, and system optimization opportunities.
            </p>
            <a href="#" style={styles.learnMoreBtn} className="learn-more" onClick={createExplosion}>Learn more →</a>
          </div>
          
          <div style={styles.serviceCard} className="service-card" onClick={createExplosion}>
            <span style={styles.serviceIcon} className="service-icon">⚡</span>
            <h3 style={styles.serviceTitle} className="service-title" onClick={createExplosion}>Smart Automation</h3>
            <p style={styles.serviceDescription}>
              Working towards automated valve controls, filter rotation, and emergency shutdowns based on real-time data analysis.
            </p>
            <a href="#" style={styles.learnMoreBtn} className="learn-more" onClick={createExplosion}>Learn more →</a>
          </div>
        </div>

        {/* Current Metrics */}
        <div style={styles.metricsSection}>
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard} className="metric-card" onClick={createExplosion}>
              <div style={styles.metricValue} className="metric-value">245<span style={{fontSize: '1.5rem', color: 'rgba(255,255,255,0.7)'}}>ppm</span></div>
              <div style={styles.metricLabel}>Total Dissolved Solids</div>
            </div>
            <div style={styles.metricCard} className="metric-card" onClick={createExplosion}>
              <div style={styles.metricValue} className="metric-value">7.2</div>
              <div style={styles.metricLabel}>pH Level</div>
            </div>
            <div style={styles.metricCard} className="metric-card" onClick={createExplosion}>
              <div style={styles.metricValue} className="metric-value">420<span style={{fontSize: '1.5rem', color: 'rgba(255,255,255,0.7)'}}>mV</span></div>
              <div style={styles.metricLabel}>Oxidation Potential</div>
            </div>
            <div style={styles.metricCard} className="metric-card" onClick={createExplosion}>
              <div style={styles.metricValue} className="metric-value">0.3<span style={{fontSize: '1.5rem', color: 'rgba(255,255,255,0.7)'}}>NTU</span></div>
              <div style={styles.metricLabel}>Turbidity</div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section style={styles.section} id="case-studies">
        <h2 style={styles.sectionTitle} className="section-title" onClick={createExplosion}>Our project aspirations</h2>
        <p style={styles.sectionSubtitle}>Areas where we aim to make an impact in water management</p>
        
        <div style={styles.caseStudiesGrid}>
          <div style={styles.caseStudyCard} className="case-study-card" onClick={createExplosion}>
            <div style={{
              ...styles.caseStudyImage,
              backgroundImage: 'url(https://voxdev.org/sites/default/files/2024-09/Clean%20water%20photo.jpg)'
            }}>
              <div style={styles.caseStudyImageOverlay} className="overlay">
                🏭
              </div>
            </div>
            <div style={styles.caseStudyContent}>
              <h3 style={styles.caseStudyTitle}>Industrial Plant Optimization</h3>
              <p style={styles.caseStudyMeta}>Target: Manufacturing • Water Treatment</p>
              <p style={styles.serviceDescription}>
                Goal to reduce water waste by 40% and maintenance costs by 60% through predictive analytics in industrial settings.
              </p>
            </div>
          </div>
          
          <div style={styles.caseStudyCard} className="case-study-card" onClick={createExplosion}>
            <div style={{
              ...styles.caseStudyImage,
              backgroundImage: 'url(https://corporater.com/wp-content/uploads/2021/02/Corporater-Social-Impact-Jawadhi-Hills-Installation-04.jpg)'
            }}>
              <div style={styles.caseStudyImageOverlay} className="overlay">
                🏛️
              </div>
            </div>
            <div style={styles.caseStudyContent}>
              <h3 style={styles.caseStudyTitle}>Municipal Water System</h3>
              <p style={styles.caseStudyMeta}>Vision: Government • Public Health</p>
              <p style={styles.serviceDescription}>
                Aspiration to ensure 99.9% uptime and regulatory compliance for large-scale municipal water systems.
              </p>
            </div>
          </div>
          
          <div style={styles.caseStudyCard} className="case-study-card" onClick={createExplosion}>
            <div style={{
              ...styles.caseStudyImage,
              backgroundImage: 'url(https://voxdev.org/sites/default/files/2024-09/Clean%20water%20photo.jpg)'
            }}>
              <div style={styles.caseStudyImageOverlay} className="overlay">
                🌿
              </div>
            </div>
            <div style={styles.caseStudyContent}>
              <h3 style={styles.caseStudyTitle}>Agricultural Innovation</h3>
              <p style={styles.caseStudyMeta}>Dream: Agriculture • Sustainability</p>
              <p style={styles.serviceDescription}>
                Targeting 30% water savings and improved crop yields through optimized irrigation monitoring systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clients */}
      <section style={styles.clientsSection}>
        <h3 style={{fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '40px', fontFamily: '"Exo 2", sans-serif'}}>
          Organizations we aspire to partner with
        </h3>
        <div style={styles.clientLogos}>
          <img 
            src="https://w7.pngwing.com/pngs/86/10/png-transparent-water-for-people-drinking-water-organization-logo-business-business-text-people-logo.png" 
            alt="Water for People" 
            style={styles.clientLogoImage} 
            className="client-logo-img"
            onClick={createExplosion}
          />
          <div style={styles.clientLogo} className="client-logo" onClick={createExplosion}>AquaTech</div>
          <div style={styles.clientLogo} className="client-logo" onClick={createExplosion}>WaterWorks</div>
          <div style={styles.clientLogo} className="client-logo" onClick={createExplosion}>HydroSys</div>
          <div style={styles.clientLogo} className="client-logo" onClick={createExplosion}>BlueFlow</div>
          <div style={styles.clientLogo} className="client-logo" onClick={createExplosion}>ClearWater</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={{...styles.logo, fontSize: '1.25rem', marginBottom: '24px'}}>AquaSentinel</div>
          <p style={{color: 'rgba(255, 255, 255, 0.6)', marginBottom: '32px', fontFamily: '"Exo 2", sans-serif'}}>
            AI-Powered Water Intelligence Platform - Student Project
          </p>
          <p style={{color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.9rem', fontFamily: '"Exo 2", sans-serif'}}>
            © 2024 AquaSentinel. College project - all rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App 