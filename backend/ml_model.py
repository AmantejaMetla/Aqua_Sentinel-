"""
AquaSentinel Machine Learning Module
Implements predictive models for filter saturation, sensor anomalies, and water quality optimization
"""

import numpy as np
import pandas as pd
import pickle
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import sqlite3
import asyncio

# Machine Learning imports
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, accuracy_score
import joblib

# Local imports
from sensors import SensorReading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FilterSaturationPredictor:
    """Predicts filter saturation based on water quality metrics"""
    
    def __init__(self, model_path: str = "./models/filter_model.pkl"):
        self.model_path = Path(model_path)
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = ['tds', 'ph', 'orp', 'turbidity', 'temperature', 
                               'flow_rate', 'usage_hours', 'days_since_replacement']
        
        # Create models directory if it doesn't exist
        self.model_path.parent.mkdir(exist_ok=True)
        
        # Load existing model if available
        self.load_model()
    
    def prepare_features(self, readings: List[SensorReading], 
                        filter_usage_hours: float = 0,
                        days_since_replacement: int = 0,
                        flow_rate: float = 2.5) -> np.ndarray:
        """Prepare features for ML model"""
        
        if not readings:
            return np.array([])
        
        # Get latest reading
        latest = readings[-1]
        
        # Calculate derived features
        features = {
            'tds': latest.tds,
            'ph': latest.ph,
            'orp': latest.orp,
            'turbidity': latest.turbidity,
            'temperature': latest.temperature,
            'flow_rate': flow_rate,
            'usage_hours': filter_usage_hours,
            'days_since_replacement': days_since_replacement
        }
        
        # Add trend features if we have enough data
        if len(readings) >= 5:
            recent_readings = readings[-5:]
            
            # Calculate trends
            tds_trend = np.mean([r.tds for r in recent_readings[-3:]]) - np.mean([r.tds for r in recent_readings[:2]])
            ph_trend = np.mean([r.ph for r in recent_readings[-3:]]) - np.mean([r.ph for r in recent_readings[:2]])
            
            features.update({
                'tds_trend': tds_trend,
                'ph_trend': ph_trend,
                'turbidity_variance': np.var([r.turbidity for r in recent_readings])
            })
        else:
            features.update({
                'tds_trend': 0,
                'ph_trend': 0,
                'turbidity_variance': 0
            })
        
        return np.array([features[col] for col in self.feature_columns + ['tds_trend', 'ph_trend', 'turbidity_variance']])
    
    def generate_training_data(self, db_path: str = "./aquasentinel.db") -> Tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data based on real sensor patterns"""
        
        try:
            # Try to load real data first
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT timestamp, tds, ph, orp, turbidity, temperature
                FROM sensor_readings
                ORDER BY timestamp
            ''')
            
            real_data = cursor.fetchall()
            conn.close()
            
        except Exception as e:
            logger.warning(f"Could not load real data: {e}. Using synthetic data.")
            real_data = []
        
        # Generate synthetic training data
        np.random.seed(42)
        n_samples = 1000
        
        X = []
        y = []
        
        for i in range(n_samples):
            # Simulate filter usage progression
            days_since_replacement = np.random.uniform(0, 90)  # 0-90 days
            usage_hours = days_since_replacement * np.random.uniform(8, 16)  # 8-16 hours/day
            
            # Base water quality (clean)
            base_tds = np.random.uniform(150, 250)
            base_ph = np.random.uniform(7.0, 7.5)
            base_orp = np.random.uniform(300, 500)
            base_turbidity = np.random.uniform(0.1, 0.3)
            
            # Filter degradation effects
            degradation_factor = min(days_since_replacement / 60.0, 1.0)  # Max degradation at 60 days
            
            # Simulate how filter degradation affects readings
            tds = base_tds * (1 + degradation_factor * 0.3)  # TDS increases as filter degrades
            ph = base_ph + np.random.normal(0, 0.1)
            orp = base_orp * (1 - degradation_factor * 0.2)  # ORP decreases
            turbidity = base_turbidity * (1 + degradation_factor * 2.0)  # Turbidity increases significantly
            temperature = np.random.uniform(20, 25)
            flow_rate = 2.5 * (1 - degradation_factor * 0.1)  # Flow rate decreases slightly
            
            # Add some noise
            tds += np.random.normal(0, 10)
            turbidity += np.random.normal(0, 0.05)
            
            # Calculate filter saturation percentage (0-100%)
            saturation = min(degradation_factor * 100 + np.random.normal(0, 5), 100)
            
            features = np.array([
                tds, ph, orp, turbidity, temperature, flow_rate, 
                usage_hours, days_since_replacement, 0, 0, 0  # trends initially 0
            ])
            
            X.append(features)
            y.append(saturation)
        
        return np.array(X), np.array(y)
    
    def train_model(self, force_retrain: bool = False):
        """Train the filter saturation prediction model"""
        
        if self.is_trained and not force_retrain:
            logger.info("Model already trained. Use force_retrain=True to retrain.")
            return
        
        logger.info("Training filter saturation prediction model...")
        
        # Generate training data
        X, y = self.generate_training_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Random Forest model
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        train_pred = self.model.predict(X_train_scaled)
        test_pred = self.model.predict(X_test_scaled)
        
        train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
        test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
        
        logger.info(f"Model training completed. Train RMSE: {train_rmse:.2f}, Test RMSE: {test_rmse:.2f}")
        
        # Feature importance
        feature_names = self.feature_columns + ['tds_trend', 'ph_trend', 'turbidity_variance']
        importance = self.model.feature_importances_
        
        for name, imp in zip(feature_names, importance):
            logger.info(f"Feature importance - {name}: {imp:.3f}")
        
        self.is_trained = True
        self.save_model()
    
    def predict_saturation(self, readings: List[SensorReading], 
                          filter_usage_hours: float = 0,
                          days_since_replacement: int = 0) -> Dict:
        """Predict filter saturation percentage"""
        
        if not self.is_trained or self.model is None:
            logger.warning("Model not trained. Training with synthetic data...")
            self.train_model()
        
        features = self.prepare_features(readings, filter_usage_hours, days_since_replacement)
        
        if len(features) == 0:
            return {"error": "No data available for prediction"}
        
        # Scale features
        features_scaled = self.scaler.transform(features.reshape(1, -1))
        
        # Make prediction
        saturation = self.model.predict(features_scaled)[0]
        saturation = max(0, min(100, saturation))  # Clamp between 0-100%
        
        # Estimate time until replacement needed (assuming 80% saturation threshold)
        if saturation < 80:
            # Estimate based on current rate of change
            replacement_threshold = 80
            days_remaining = max(0, (replacement_threshold - saturation) / max(1, saturation / max(1, days_since_replacement)))
        else:
            days_remaining = 0
        
        return {
            "saturation_percent": round(saturation, 1),
            "days_until_replacement": round(days_remaining, 1),
            "replacement_needed": saturation >= 80,
            "confidence": "high" if saturation > 20 else "medium"
        }
    
    def save_model(self):
        """Save trained model and scaler"""
        try:
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'feature_columns': self.feature_columns,
                'is_trained': self.is_trained
            }
            
            joblib.dump(model_data, self.model_path)
            logger.info(f"Model saved to {self.model_path}")
            
        except Exception as e:
            logger.error(f"Error saving model: {e}")
    
    def load_model(self):
        """Load saved model and scaler"""
        try:
            if self.model_path.exists():
                model_data = joblib.load(self.model_path)
                
                self.model = model_data['model']
                self.scaler = model_data['scaler']
                self.feature_columns = model_data['feature_columns']
                self.is_trained = model_data['is_trained']
                
                logger.info("Model loaded successfully")
            else:
                logger.info("No saved model found. Will train on first prediction.")
                
        except Exception as e:
            logger.error(f"Error loading model: {e}")

class AnomalyDetector:
    """Detects anomalies in sensor readings"""
    
    def __init__(self):
        self.baseline_stats = {}
        self.anomaly_thresholds = {
            'tds': {'min': 50, 'max': 800},
            'ph': {'min': 6.0, 'max': 9.0},
            'orp': {'min': 100, 'max': 900},
            'turbidity': {'min': 0, 'max': 5.0},
            'temperature': {'min': 10, 'max': 35}
        }
    
    def update_baseline(self, readings: List[SensorReading]):
        """Update baseline statistics from recent normal readings"""
        if len(readings) < 10:
            return
        
        # Calculate statistics for each parameter
        for param in ['tds', 'ph', 'orp', 'turbidity', 'temperature']:
            values = [getattr(r, param) for r in readings[-50:]]  # Use last 50 readings
            
            self.baseline_stats[param] = {
                'mean': np.mean(values),
                'std': np.std(values),
                'median': np.median(values),
                'q25': np.percentile(values, 25),
                'q75': np.percentile(values, 75)
            }
    
    def detect_anomalies(self, reading: SensorReading) -> Dict[str, str]:
        """Detect anomalies in a sensor reading"""
        anomalies = {}
        
        for param in ['tds', 'ph', 'orp', 'turbidity', 'temperature']:
            value = getattr(reading, param)
            
            # Check absolute thresholds
            thresholds = self.anomaly_thresholds[param]
            if value < thresholds['min'] or value > thresholds['max']:
                anomalies[param] = f"Value {value} outside normal range ({thresholds['min']}-{thresholds['max']})"
                continue
            
            # Check against baseline if available
            if param in self.baseline_stats:
                stats = self.baseline_stats[param]
                
                # Check for outliers (3 standard deviations)
                if abs(value - stats['mean']) > 3 * stats['std']:
                    anomalies[param] = f"Value {value} is {abs(value - stats['mean']) / stats['std']:.1f} std dev from normal"
                
                # Check for significant deviation from median
                iqr = stats['q75'] - stats['q25']
                if abs(value - stats['median']) > 2 * iqr:
                    anomalies[param] = f"Value {value} significantly different from typical range"
        
        return anomalies

class WaterQualityOptimizer:
    """Optimizes water treatment based on input conditions and goals"""
    
    def __init__(self):
        self.target_ranges = {
            'tds': {'min': 150, 'max': 300, 'optimal': 225},
            'ph': {'min': 6.5, 'max': 8.5, 'optimal': 7.2},
            'orp': {'min': 300, 'max': 600, 'optimal': 450},
            'turbidity': {'min': 0, 'max': 1.0, 'optimal': 0.2}
        }
    
    def get_optimization_recommendations(self, reading: SensorReading) -> Dict:
        """Get recommendations for optimizing water quality"""
        recommendations = []
        actions = []
        
        # TDS optimization
        if reading.tds > self.target_ranges['tds']['max']:
            recommendations.append("TDS too high - increase reverse osmosis pressure")
            actions.append({"type": "filter_adjustment", "parameter": "ro_pressure", "change": "+10%"})
        elif reading.tds < self.target_ranges['tds']['min']:
            recommendations.append("TDS too low - add mineral cartridge or reduce filtration")
            actions.append({"type": "filter_adjustment", "parameter": "mineral_addition", "change": "enable"})
        
        # pH optimization
        if reading.ph > self.target_ranges['ph']['max']:
            recommendations.append("pH too high - activate acid injection system")
            actions.append({"type": "chemical_dosing", "chemical": "acid", "amount": "low"})
        elif reading.ph < self.target_ranges['ph']['min']:
            recommendations.append("pH too low - activate alkaline injection system")
            actions.append({"type": "chemical_dosing", "chemical": "alkaline", "amount": "low"})
        
        # ORP optimization  
        if reading.orp < self.target_ranges['orp']['min']:
            recommendations.append("ORP too low - increase chlorination or ozonation")
            actions.append({"type": "disinfection", "method": "chlorine", "change": "+20%"})
        elif reading.orp > self.target_ranges['orp']['max']:
            recommendations.append("ORP too high - reduce disinfectant dosing")
            actions.append({"type": "disinfection", "method": "chlorine", "change": "-15%"})
        
        # Turbidity optimization
        if reading.turbidity > self.target_ranges['turbidity']['max']:
            recommendations.append("Turbidity too high - backwash filters or replace cartridges")
            actions.append({"type": "filter_maintenance", "action": "backwash"})
        
        if not recommendations:
            recommendations.append("Water quality within optimal ranges")
        
        return {
            "recommendations": recommendations,
            "actions": actions,
            "quality_score": self._calculate_quality_score(reading),
            "overall_status": self._get_overall_status(reading)
        }
    
    def _calculate_quality_score(self, reading: SensorReading) -> float:
        """Calculate overall water quality score (0-100)"""
        scores = []
        
        for param in ['tds', 'ph', 'orp', 'turbidity']:
            value = getattr(reading, param)
            target = self.target_ranges[param]
            
            # Calculate how close the value is to optimal
            if value == target['optimal']:
                score = 100
            elif target['min'] <= value <= target['max']:
                # Linear score within acceptable range
                if value < target['optimal']:
                    score = 80 + 20 * (value - target['min']) / (target['optimal'] - target['min'])
                else:
                    score = 80 + 20 * (target['max'] - value) / (target['max'] - target['optimal'])
            else:
                # Outside acceptable range
                if value < target['min']:
                    score = max(0, 80 * (value / target['min']))
                else:
                    score = max(0, 80 * (target['max'] / value))
            
            scores.append(score)
        
        return round(np.mean(scores), 1)
    
    def _get_overall_status(self, reading: SensorReading) -> str:
        """Get overall water quality status"""
        score = self._calculate_quality_score(reading)
        
        if score >= 90:
            return "excellent"
        elif score >= 80:
            return "good"
        elif score >= 70:
            return "acceptable"
        elif score >= 60:
            return "poor"
        else:
            return "critical"

# Global instances
filter_predictor = FilterSaturationPredictor()
anomaly_detector = AnomalyDetector()
quality_optimizer = WaterQualityOptimizer()

async def analyze_water_quality(readings: List[SensorReading], 
                               filter_usage_hours: float = 0,
                               days_since_replacement: int = 0) -> Dict:
    """Comprehensive water quality analysis"""
    
    if not readings:
        return {"error": "No sensor readings provided"}
    
    latest_reading = readings[-1]
    
    # Update anomaly detector baseline
    anomaly_detector.update_baseline(readings)
    
    # Run all analyses
    filter_analysis = filter_predictor.predict_saturation(readings, filter_usage_hours, days_since_replacement)
    anomalies = anomaly_detector.detect_anomalies(latest_reading)
    optimization = quality_optimizer.get_optimization_recommendations(latest_reading)
    
    return {
        "timestamp": latest_reading.timestamp.isoformat(),
        "current_readings": latest_reading.to_dict(),
        "filter_analysis": filter_analysis,
        "anomalies": anomalies,
        "optimization": optimization,
        "alerts": _generate_alerts(filter_analysis, anomalies, optimization)
    }

def _generate_alerts(filter_analysis: Dict, anomalies: Dict, optimization: Dict) -> List[Dict]:
    """Generate alerts based on analysis results"""
    alerts = []
    
    # Filter replacement alerts
    if filter_analysis.get("replacement_needed"):
        alerts.append({
            "type": "filter_replacement",
            "severity": "high",
            "message": f"Filter replacement needed (saturation: {filter_analysis.get('saturation_percent', 0)}%)"
        })
    elif filter_analysis.get("saturation_percent", 0) > 60:
        alerts.append({
            "type": "filter_warning",
            "severity": "medium",
            "message": f"Filter saturation at {filter_analysis.get('saturation_percent', 0)}%"
        })
    
    # Anomaly alerts
    for param, message in anomalies.items():
        alerts.append({
            "type": "sensor_anomaly",
            "severity": "high",
            "message": f"Anomaly detected in {param}: {message}"
        })
    
    # Quality alerts
    if optimization.get("quality_score", 100) < 70:
        alerts.append({
            "type": "water_quality",
            "severity": "medium",
            "message": f"Water quality below acceptable level (score: {optimization.get('quality_score', 0)})"
        })
    
    return alerts

if __name__ == "__main__":
    # Test the ML models
    logger.info("Testing ML models...")
    
    # Train the filter prediction model
    filter_predictor.train_model(force_retrain=True)
    
    # Test with sample data
    from sensors import SensorReading
    sample_readings = [
        SensorReading(datetime.now(), 250, 7.2, 400, 0.3, 22),
        SensorReading(datetime.now(), 280, 7.1, 380, 0.4, 23),
        SensorReading(datetime.now(), 300, 7.0, 360, 0.5, 22)
    ]
    
    # Run analysis
    result = asyncio.run(analyze_water_quality(sample_readings, filter_usage_hours=200, days_since_replacement=30))
    print(json.dumps(result, indent=2, default=str)) 