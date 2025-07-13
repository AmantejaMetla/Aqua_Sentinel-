"""
AquaSentinel Weather Integration Module
Integrates weather data for informed water treatment decisions
"""

import asyncio
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WeatherDataManager:
    """Manages weather data retrieval and analysis"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('OPENWEATHER_API_KEY', '9cf4ca9d91b7bb64caa05362c5459ce7')
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.cache = {}
        self.cache_duration = 600  # 10 minutes cache
        
    async def get_current_weather(self, latitude: float, longitude: float) -> Optional[Dict]:
        """Get current weather data for given coordinates"""
        
        cache_key = f"current_{latitude}_{longitude}"
        
        # Check cache first
        if self._is_cache_valid(cache_key):
            logger.debug("Returning cached weather data")
            return self.cache[cache_key]["data"]
        
        try:
            url = f"{self.base_url}/weather"
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Cache the result
                self.cache[cache_key] = {
                    "data": data,
                    "timestamp": datetime.now()
                }
                
                logger.info(f"Weather data retrieved for {latitude}, {longitude}")
                return data
            else:
                logger.error(f"Weather API error: {response.status_code}")
                return None
                        
        except Exception as e:
            logger.error(f"Error fetching weather data: {e}")
            return None
    
    async def get_weather_forecast(self, latitude: float, longitude: float, days: int = 5) -> Optional[Dict]:
        """Get weather forecast for given coordinates"""
        
        cache_key = f"forecast_{latitude}_{longitude}_{days}"
        
        # Check cache first
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]["data"]
        
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'lat': latitude,
                'lon': longitude,
                'appid': self.api_key,
                'units': 'metric',
                'cnt': days * 8  # 8 forecasts per day (3-hour intervals)
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Cache the result
                self.cache[cache_key] = {
                    "data": data,
                    "timestamp": datetime.now()
                }
                
                logger.info(f"Weather forecast retrieved for {latitude}, {longitude}")
                return data
            else:
                logger.error(f"Weather API error: {response.status_code}")
                return None
                        
        except Exception as e:
            logger.error(f"Error fetching weather forecast: {e}")
            return None
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        if cache_key not in self.cache:
            return False
        
        cache_time = self.cache[cache_key]["timestamp"]
        return (datetime.now() - cache_time).total_seconds() < self.cache_duration

class WeatherAnalyzer:
    """Analyzes weather data for water treatment optimization"""
    
    def __init__(self):
        self.rain_intensity_thresholds = {
            'light': 2.5,    # mm/h
            'moderate': 10,  # mm/h
            'heavy': 50      # mm/h
        }
        
        self.pollution_factors = {
            'industrial': 1.5,
            'urban': 1.3,
            'suburban': 1.1,
            'rural': 1.0
        }
    
    def analyze_current_conditions(self, weather_data: Dict, area_type: str = 'suburban') -> Dict:
        """Analyze current weather conditions for water treatment impact"""
        
        if not weather_data:
            return {"error": "No weather data available"}
        
        try:
            main = weather_data.get('main', {})
            weather = weather_data.get('weather', [{}])[0]
            wind = weather_data.get('wind', {})
            rain = weather_data.get('rain', {})
            
            # Extract key parameters
            temperature = main.get('temp', 20)
            humidity = main.get('humidity', 50)
            pressure = main.get('pressure', 1013)
            weather_condition = weather.get('main', 'Clear')
            wind_speed = wind.get('speed', 0)
            rainfall = rain.get('1h', 0)  # mm in last hour
            
            analysis = {
                'temperature_impact': self._analyze_temperature_impact(temperature),
                'humidity_impact': self._analyze_humidity_impact(humidity),
                'rainfall_impact': self._analyze_rainfall_impact(rainfall, area_type),
                'air_quality_impact': self._analyze_air_quality_impact(weather_condition, wind_speed),
                'overall_risk': 'low',
                'recommendations': []
            }
            
            # Calculate overall risk
            risks = []
            if analysis['temperature_impact']['risk'] != 'low':
                risks.append(analysis['temperature_impact']['risk'])
            if analysis['rainfall_impact']['risk'] != 'low':
                risks.append(analysis['rainfall_impact']['risk'])
            if analysis['air_quality_impact']['risk'] != 'low':
                risks.append(analysis['air_quality_impact']['risk'])
            
            if 'high' in risks:
                analysis['overall_risk'] = 'high'
            elif 'medium' in risks:
                analysis['overall_risk'] = 'medium'
            
            # Generate recommendations
            analysis['recommendations'] = self._generate_recommendations(analysis)
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing weather conditions: {e}")
            return {"error": str(e)}
    
    def _analyze_temperature_impact(self, temperature: float) -> Dict:
        """Analyze temperature impact on water quality"""
        
        if temperature < 5:
            return {
                'risk': 'medium',
                'message': 'Low temperature may reduce filtration efficiency',
                'recommendations': ['Increase filtration time', 'Monitor flow rate']
            }
        elif temperature > 30:
            return {
                'risk': 'medium',
                'message': 'High temperature may increase bacterial growth risk',
                'recommendations': ['Increase disinfection', 'Monitor microbial levels']
            }
        else:
            return {
                'risk': 'low',
                'message': 'Temperature within normal range',
                'recommendations': []
            }
    
    def _analyze_humidity_impact(self, humidity: float) -> Dict:
        """Analyze humidity impact on system performance"""
        
        if humidity > 85:
            return {
                'risk': 'medium',
                'message': 'High humidity may affect electronic components',
                'recommendations': ['Check sensor calibration', 'Monitor for condensation']
            }
        elif humidity < 30:
            return {
                'risk': 'low',
                'message': 'Low humidity - monitor for static buildup',
                'recommendations': ['Check electrical connections']
            }
        else:
            return {
                'risk': 'low',
                'message': 'Humidity within acceptable range',
                'recommendations': []
            }
    
    def _analyze_rainfall_impact(self, rainfall: float, area_type: str) -> Dict:
        """Analyze rainfall impact on source water quality"""
        
        pollution_factor = self.pollution_factors.get(area_type, 1.1)
        adjusted_impact = rainfall * pollution_factor
        
        if rainfall == 0:
            return {
                'risk': 'low',
                'message': 'No rainfall - stable source conditions',
                'recommendations': []
            }
        elif adjusted_impact < self.rain_intensity_thresholds['light']:
            return {
                'risk': 'low',
                'message': 'Light rainfall - minimal impact on source water',
                'recommendations': ['Continue normal operation']
            }
        elif adjusted_impact < self.rain_intensity_thresholds['moderate']:
            return {
                'risk': 'medium',
                'message': 'Moderate rainfall - potential source water contamination',
                'recommendations': ['Increase pre-filtration', 'Monitor turbidity closely']
            }
        else:
            return {
                'risk': 'high',
                'message': 'Heavy rainfall - significant contamination risk',
                'recommendations': ['Activate enhanced filtration', 'Increase monitoring frequency', 'Consider alternative source']
            }
    
    def _analyze_air_quality_impact(self, weather_condition: str, wind_speed: float) -> Dict:
        """Analyze air quality and wind impact"""
        
        high_pollution_conditions = ['Haze', 'Smoke', 'Dust', 'Sand', 'Fog']
        
        if weather_condition in high_pollution_conditions:
            return {
                'risk': 'high',
                'message': f'{weather_condition} conditions may increase airborne contaminants',
                'recommendations': ['Activate air filtration', 'Increase water pre-treatment']
            }
        elif wind_speed > 15:  # m/s
            return {
                'risk': 'medium',
                'message': 'High winds may increase dust and debris',
                'recommendations': ['Monitor pre-filters', 'Check intake protection']
            }
        else:
            return {
                'risk': 'low',
                'message': 'Good air quality conditions',
                'recommendations': []
            }
    
    def _generate_recommendations(self, analysis: Dict) -> List[str]:
        """Generate consolidated recommendations based on all factors"""
        
        recommendations = []
        
        # Collect all individual recommendations
        for factor in ['temperature_impact', 'humidity_impact', 'rainfall_impact', 'air_quality_impact']:
            if factor in analysis:
                recommendations.extend(analysis[factor].get('recommendations', []))
        
        # Add overall recommendations based on risk level
        if analysis['overall_risk'] == 'high':
            recommendations.extend([
                'Increase monitoring frequency to every 15 minutes',
                'Activate all backup filtration systems',
                'Prepare for manual intervention if needed'
            ])
        elif analysis['overall_risk'] == 'medium':
            recommendations.extend([
                'Increase monitoring frequency to every 30 minutes',
                'Review filter replacement schedule'
            ])
        
        # Remove duplicates while preserving order
        return list(dict.fromkeys(recommendations))

class WeatherBasedController:
    """Controls water treatment based on weather conditions"""
    
    def __init__(self, weather_manager: WeatherDataManager, analyzer: WeatherAnalyzer):
        self.weather_manager = weather_manager
        self.analyzer = analyzer
        self.monitoring_locations = []
        self.alert_thresholds = {
            'rainfall': 10,  # mm/h
            'temperature': {'min': 0, 'max': 35},
            'wind_speed': 20  # m/s
        }
    
    def add_monitoring_location(self, name: str, latitude: float, longitude: float, area_type: str = 'suburban'):
        """Add a location for weather monitoring"""
        location = {
            'name': name,
            'latitude': latitude,
            'longitude': longitude,
            'area_type': area_type
        }
        self.monitoring_locations.append(location)
        logger.info(f"Added monitoring location: {name}")
    
    async def get_treatment_recommendations(self, location_name: str = None) -> Dict:
        """Get weather-based treatment recommendations"""
        
        if not self.monitoring_locations:
            return {"error": "No monitoring locations configured"}
        
        # Use specified location or first available
        location = None
        if location_name:
            location = next((loc for loc in self.monitoring_locations if loc['name'] == location_name), None)
        
        if not location:
            location = self.monitoring_locations[0]
        
        # Get current weather
        weather_data = await self.weather_manager.get_current_weather(
            location['latitude'], 
            location['longitude']
        )
        
        if not weather_data:
            return {"error": "Unable to retrieve weather data"}
        
        # Analyze conditions
        analysis = self.analyzer.analyze_current_conditions(weather_data, location['area_type'])
        
        # Generate treatment adjustments
        treatment_adjustments = self._generate_treatment_adjustments(analysis, weather_data)
        
        return {
            'location': location['name'],
            'weather_conditions': self._extract_current_conditions(weather_data),
            'analysis': analysis,
            'treatment_adjustments': treatment_adjustments,
            'timestamp': datetime.now().isoformat()
        }
    
    async def check_weather_alerts(self) -> List[Dict]:
        """Check for weather-based alerts across all monitoring locations"""
        
        alerts = []
        
        for location in self.monitoring_locations:
            weather_data = await self.weather_manager.get_current_weather(
                location['latitude'], 
                location['longitude']
            )
            
            if weather_data:
                location_alerts = self._check_location_alerts(location, weather_data)
                alerts.extend(location_alerts)
        
        return alerts
    
    def _extract_current_conditions(self, weather_data: Dict) -> Dict:
        """Extract current weather conditions for display"""
        
        main = weather_data.get('main', {})
        weather = weather_data.get('weather', [{}])[0]
        wind = weather_data.get('wind', {})
        rain = weather_data.get('rain', {})
        
        return {
            'temperature': main.get('temp'),
            'humidity': main.get('humidity'),
            'pressure': main.get('pressure'),
            'weather': weather.get('description'),
            'wind_speed': wind.get('speed'),
            'rainfall': rain.get('1h', 0),
            'visibility': weather_data.get('visibility', 'N/A')
        }
    
    def _generate_treatment_adjustments(self, analysis: Dict, weather_data: Dict) -> Dict:
        """Generate specific treatment system adjustments"""
        
        adjustments = {
            'filtration_rate': 'normal',
            'disinfection_level': 'normal',
            'monitoring_frequency': 'normal',
            'backup_systems': 'standby'
        }
        
        risk_level = analysis.get('overall_risk', 'low')
        
        # Adjust based on risk level
        if risk_level == 'high':
            adjustments.update({
                'filtration_rate': 'increased',
                'disinfection_level': 'enhanced',
                'monitoring_frequency': 'high',
                'backup_systems': 'active'
            })
        elif risk_level == 'medium':
            adjustments.update({
                'filtration_rate': 'slightly_increased',
                'disinfection_level': 'increased',
                'monitoring_frequency': 'increased',
                'backup_systems': 'ready'
            })
        
        # Specific weather-based adjustments
        rain = weather_data.get('rain', {}).get('1h', 0)
        if rain > 5:
            adjustments['pre_filtration'] = 'enhanced'
            adjustments['turbidity_monitoring'] = 'continuous'
        
        temp = weather_data.get('main', {}).get('temp', 20)
        if temp > 25:
            adjustments['disinfection_contact_time'] = 'extended'
        
        return adjustments
    
    def _check_location_alerts(self, location: Dict, weather_data: Dict) -> List[Dict]:
        """Check for weather alerts at a specific location"""
        
        alerts = []
        
        # Temperature alerts
        temp = weather_data.get('main', {}).get('temp')
        if temp is not None:
            if temp < self.alert_thresholds['temperature']['min']:
                alerts.append({
                    'type': 'low_temperature',
                    'severity': 'medium',
                    'location': location['name'],
                    'message': f"Low temperature alert: {temp}°C",
                    'value': temp
                })
            elif temp > self.alert_thresholds['temperature']['max']:
                alerts.append({
                    'type': 'high_temperature',
                    'severity': 'medium',
                    'location': location['name'],
                    'message': f"High temperature alert: {temp}°C",
                    'value': temp
                })
        
        # Rainfall alerts
        rain = weather_data.get('rain', {}).get('1h', 0)
        if rain > self.alert_thresholds['rainfall']:
            alerts.append({
                'type': 'heavy_rainfall',
                'severity': 'high',
                'location': location['name'],
                'message': f"Heavy rainfall alert: {rain} mm/h",
                'value': rain
            })
        
        # Wind speed alerts
        wind_speed = weather_data.get('wind', {}).get('speed', 0)
        if wind_speed > self.alert_thresholds['wind_speed']:
            alerts.append({
                'type': 'high_wind',
                'severity': 'medium',
                'location': location['name'],
                'message': f"High wind speed alert: {wind_speed} m/s",
                'value': wind_speed
            })
        
        return alerts

# Global instances
weather_manager = WeatherDataManager()
weather_analyzer = WeatherAnalyzer()
weather_controller = WeatherBasedController(weather_manager, weather_analyzer)

# Default monitoring location (can be updated via configuration)
weather_controller.add_monitoring_location(
    "Primary Site", 
    40.7128, -74.0060,  # New York coordinates as default
    "urban"
)

async def get_weather_status() -> Dict:
    """Get comprehensive weather status and recommendations"""
    
    try:
        recommendations = await weather_controller.get_treatment_recommendations()
        alerts = await weather_controller.check_weather_alerts()
        
        return {
            "status": "success",
            "recommendations": recommendations,
            "alerts": alerts,
            "monitoring_locations": len(weather_controller.monitoring_locations)
        }
        
    except Exception as e:
        logger.error(f"Error getting weather status: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

async def main():
    """Main function for testing"""
    logger.info("Testing weather integration...")
    
    # Test weather data retrieval
    weather_data = await weather_manager.get_current_weather(40.7128, -74.0060)
    if weather_data:
        print(f"Current weather: {json.dumps(weather_data, indent=2)}")
        
        # Test analysis
        analysis = weather_analyzer.analyze_current_conditions(weather_data, 'urban')
        print(f"Weather analysis: {json.dumps(analysis, indent=2)}")
    
    # Test recommendations
    recommendations = await weather_controller.get_treatment_recommendations()
    print(f"Treatment recommendations: {json.dumps(recommendations, indent=2, default=str)}")
    
    # Test alerts
    alerts = await weather_controller.check_weather_alerts()
    print(f"Weather alerts: {json.dumps(alerts, indent=2)}")

if __name__ == "__main__":
    asyncio.run(main()) 