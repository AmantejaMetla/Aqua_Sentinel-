# 🌊 AquaSentinel - Intelligent Water Purification System

![AquaSentinel Logo](https://img.shields.io/badge/AquaSentinel-AI%20Water%20Purification-blue?style=for-the-badge&logo=water&logoColor=white)

AquaSentinel is an AI-enhanced software system that connects to existing **5G AI Water Filter hardware**, leveraging machine learning, IoT, and real-time dashboards to monitor, optimize, and automate water purification processes.

## ✨ Features

### 🧠 AI & Machine Learning
- **Predictive Analytics**: Random Forest models predict filter saturation and replacement needs
- **Anomaly Detection**: Real-time detection of sensor anomalies and water quality issues
- **Smart Optimization**: AI-driven recommendations for water treatment parameters
- **Self-Learning**: Adapts to changing water quality patterns over time

### 📡 IoT Integration
- **MQTT Communication**: Lightweight messaging for IoT device communication
- **Firebase Cloud Storage**: Real-time data synchronization and backup
- **WebSocket Real-time Updates**: Live dashboard updates and alerts
- **Weather Integration**: OpenWeather API for weather-informed filtering

### 🎛️ Control & Automation
- **Valve Control**: Remote open/close operations (`"0"` open, `"C"` close)
- **Filter Management**: Automated filter rotation and replacement (`"r"`, `"f"`, `"b"`)
- **Drone Dispatch**: GPS-based emergency supply delivery system
- **Emergency Controls**: Instant system shutdown capabilities

### 📊 Monitoring & Analytics
- **Real-time Sensors**: TDS, pH, ORP, Turbidity, and Temperature monitoring
- **Historical Charts**: 24h/7d data visualization with Recharts
- **Water Quality Scoring**: Comprehensive quality assessment (0-100 scale)
- **Alert System**: Multi-level alerts with severity classification

### 🌐 Modern Web Interface
- **React Frontend**: Modern, responsive dashboard interface
- **TailwindCSS**: Beautiful, mobile-first design
- **Real-time Updates**: Live data streaming via WebSockets
- **Dark Mode**: User-friendly interface with theme switching

## 🏗️ Architecture

```
AquaSentinel/
├── backend/                 # Python FastAPI Backend
│   ├── sensors.py          # Sensor data collection & validation
│   ├── iot_comm.py         # MQTT & Firebase communication
│   ├── ml_model.py         # Machine learning models
│   ├── controller.py       # Hardware control automation
│   ├── weather_integration.py # Weather API integration
│   └── main.py            # FastAPI main application
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Dashboard pages
│   │   ├── contexts/     # API & WebSocket contexts
│   │   └── App.jsx       # Main application
├── models/                # ML model storage
├── public/               # Static assets
└── requirements.txt      # Python dependencies
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/your-username/AquaSentinel.git
cd AquaSentinel
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
cd backend
python main.py
```

The backend will start on `http://localhost:8000`

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Firebase Configuration
FIREBASE_API_KEY=AIzaSyAS_jiKziqD0RFNFpgqrkU1p5jk3z1tVos
FIREBASE_AUTH_DOMAIN=aquasentinel-project.firebaseapp.com
FIREBASE_PROJECT_ID=aquasentinel-project

# OpenWeather API
OPENWEATHER_API_KEY=9cf4ca9d91b7bb64caa05362c5459ce7

# MQTT Configuration
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
MQTT_USERNAME=aquasentinel
MQTT_PASSWORD=your_mqtt_password

# Hardware Communication
SERIAL_PORT=COM3
SERIAL_BAUDRATE=9600
```

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Realtime Database and Authentication
3. Download service account key and update configuration
4. Update Firebase configuration in `frontend/firebaseConfig.js`

### MQTT Broker
The system supports multiple MQTT brokers:
- **HiveMQ Cloud** (Recommended): Free tier available
- **Eclipse Mosquitto**: Self-hosted option
- **Firebase**: Fallback WebSocket communication

## 📱 API Endpoints

### System Status
- `GET /` - API information
- `GET /health` - Health check
- `GET /status` - Comprehensive system status

### Sensor Data
- `GET /sensors/current` - Latest sensor reading
- `GET /sensors/history?hours=24` - Historical data

### Control Commands
- `POST /control` - Execute hardware commands
- `POST /emergency/stop` - Emergency system shutdown

### Analytics
- `GET /ml/analysis` - ML analysis and predictions
- `GET /weather` - Weather-based recommendations
- `GET /drone/status` - Drone system status

### Real-time Updates
- `WebSocket /ws` - Real-time data streaming

## 🤖 ML Models

### Filter Saturation Predictor
- **Algorithm**: Random Forest Regression
- **Features**: TDS, pH, ORP, Turbidity, Temperature, Usage Hours
- **Output**: Saturation percentage (0-100%) and replacement timeline

### Anomaly Detection
- **Method**: Statistical analysis with baseline learning
- **Detection**: Outliers beyond 3 standard deviations
- **Alerts**: Real-time anomaly notifications

### Water Quality Optimizer
- **Target Ranges**: WHO/EPA water quality standards
- **Recommendations**: pH adjustment, disinfection levels, filtration rates
- **Quality Score**: 0-100 based on parameter compliance

## 🌤️ Weather Integration

The system integrates with OpenWeather API to provide weather-informed treatment:

- **Rainfall Impact**: Adjusts filtration based on precipitation levels
- **Temperature Effects**: Optimizes disinfection contact time
- **Air Quality**: Monitors dust and pollution impacts
- **Seasonal Adaptation**: Learns regional weather patterns

## 🚁 Drone Integration

Emergency supply delivery system:
- **GPS Dispatch**: `dispatchDrone(lat, long)` command
- **Mission Tracking**: Real-time mission status monitoring
- **Route Optimization**: (Future enhancement with Mapbox)

## 🔒 Security Features

- **Firebase Authentication**: Secure user management
- **API Rate Limiting**: Prevents system overload
- **Input Validation**: Pydantic models for data validation
- **WebSocket Security**: Connection authentication
- **Emergency Protocols**: Fail-safe mechanisms

## 📊 Water Quality Standards

The system monitors water quality against international standards:

| Parameter | WHO Standard | EPA Standard | AquaSentinel Range |
|-----------|--------------|--------------|-------------------|
| pH | 6.5-8.5 | 6.5-8.5 | 6.5-8.5 |
| TDS | <600 ppm | <500 ppm | 150-300 ppm |
| Turbidity | <1 NTU | <1 NTU | <1 NTU |
| ORP | >300 mV | >650 mV | 300-600 mV |

## 🚀 Deployment

### Netlify (Frontend)
The frontend is configured for Netlify deployment:
```bash
npm run build
# Deploy dist/ folder to Netlify
```

### Docker (Backend)
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Platforms
- **Frontend**: Netlify, Vercel, AWS S3
- **Backend**: Heroku, Railway, AWS EC2, Google Cloud Run
- **Database**: Firebase, MongoDB Atlas, PostgreSQL

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Hardware Simulation
The system includes comprehensive simulation modes for development without actual hardware.

## 📈 Monitoring & Alerts

### Alert Severity Levels
- **🟢 Info**: Normal operational messages
- **🟡 Warning**: Parameter deviations requiring attention
- **🟠 High**: Immediate action required
- **🔴 Critical**: Emergency conditions, system shutdown

### Monitoring Metrics
- System uptime and performance
- Sensor data quality and accuracy
- ML model prediction confidence
- Network connectivity status
- Hardware component health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.aquasentinel.com](https://docs.aquasentinel.com)
- **Issues**: [GitHub Issues](https://github.com/your-username/AquaSentinel/issues)
- **Email**: support@aquasentinel.com
- **Discord**: [AquaSentinel Community](https://discord.gg/aquasentinel)

## 🏆 Acknowledgments

- **OpenWeather API** for weather data integration
- **Firebase** for cloud infrastructure
- **HiveMQ** for MQTT broker services
- **React & FastAPI** communities for excellent frameworks
- **WHO & EPA** for water quality standards

---

## 🚀 What's Next?

1. **Host on Netlify** to enable Mapbox integration
2. **Add Drone SDK** integration for delivery management
3. **Implement User Authentication** with Firebase Auth
4. **Add Machine Learning Model Training** interface
5. **Create Mobile App** for remote monitoring

**AquaSentinel** - Making clean water accessible through intelligent automation! 🌊✨ 