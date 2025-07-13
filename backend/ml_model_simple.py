"""
AquaSentinel Simplified ML Module (for testing without heavy dependencies)
Provides mock ML predictions and analysis
"""

import logging
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleSensorReading:
    """Simple sensor reading class"""
    def __init__(self, timestamp, tds, ph, orp, turbidity, temperature):
        self.timestamp = timestamp
        self.tds = tds
        self.ph = ph
        self.orp = orp
        self.turbidity = turbidity
        self.temperature = temperature
    
    def to_dict(self):
        return {
            'timestamp': self.timestamp.isoformat() if hasattr(self.timestamp, 'isoformat') else str(self.timestamp),
            'tds': self.tds,
            'ph': self.ph,
            'orp': self.orp,
            'turbidity': self.turbidity,
            'temperature': self.temperature
        }

class SimpleFilterPredictor:
    """Simplified filter prediction without ML libraries"""
    
    def __init__(self):
        self.is_trained = True  # Always ready for testing
        self.model_path = "./models/simple_filter_model.pkl"  # Mock path for compatibility
    
    def predict_saturation(self, readings: List, filter_usage_hours: float = 0, days_since_replacement: int = 0) -> Dict:
        """Predict filter saturation using simple rules"""
        
        if not readings:
            return {"error": "No data available for prediction"}
        
        # Simple rule-based prediction
        latest = readings[-1] if hasattr(readings[-1], 'tds') else SimpleSensorReading(
            datetime.now(), readings[-1].get('tds', 250), readings[-1].get('ph', 7.2),
            readings[-1].get('orp', 400), readings[-1].get('turbidity', 0.3), readings[-1].get('temperature', 22)
        )
        
        # Calculate saturation based on simple rules
        base_saturation = min(days_since_replacement * 1.2, 90)  # 1.2% per day
        
        # Adjust based on water quality
        if latest.tds > 300:
            base_saturation += 10
        if latest.turbidity > 0.5:
            base_saturation += 15
        if latest.ph < 6.5 or latest.ph > 8.5:
            base_saturation += 5
        
        saturation = min(base_saturation + random.uniform(-5, 5), 100)
        
        # Calculate days until replacement
        if saturation < 80:
            days_remaining = (80 - saturation) / 1.5  # Simple linear projection
        else:
            days_remaining = 0
        
        return {
            "saturation_percent": round(saturation, 1),
            "days_until_replacement": round(days_remaining, 1),
            "replacement_needed": saturation >= 80,
            "confidence": "high" if saturation > 20 else "medium"
        }
    
    def train_model(self, force_retrain: bool = False):
        """Mock training - already 'trained'"""
        logger.info("Mock ML model training completed")
        self.is_trained = True

class SimpleAnomalyDetector:
    """Simple anomaly detection without ML libraries"""
    
    def __init__(self):
        self.baseline_stats = {}
    
    def detect_anomalies(self, reading) -> Dict[str, str]:
        """Detect anomalies using simple threshold rules"""
        anomalies = {}
        
        # Simple threshold-based detection
        if hasattr(reading, 'tds'):
            tds = reading.tds
        else:
            tds = reading.get('tds', 0)
            
        if hasattr(reading, 'ph'):
            ph = reading.ph
        else:
            ph = reading.get('ph', 7.0)
            
        if hasattr(reading, 'orp'):
            orp = reading.orp
        else:
            orp = reading.get('orp', 0)
            
        if hasattr(reading, 'turbidity'):
            turbidity = reading.turbidity
        else:
            turbidity = reading.get('turbidity', 0)
        
        # Check thresholds
        if tds < 50 or tds > 800:
            anomalies['tds'] = f"TDS value {tds} outside normal range (50-800 ppm)"
        
        if ph < 6.0 or ph > 9.0:
            anomalies['ph'] = f"pH value {ph} outside safe range (6.0-9.0)"
        
        if orp < 100 or orp > 900:
            anomalies['orp'] = f"ORP value {orp} outside normal range (100-900 mV)"
        
        if turbidity > 5.0:
            anomalies['turbidity'] = f"Turbidity {turbidity} too high (>5.0 NTU)"
        
        return anomalies
    
    def update_baseline(self, readings: List):
        """Mock baseline update"""
        logger.debug("Baseline updated with mock statistics")

class SimpleWaterQualityOptimizer:
    """Simple water quality optimization"""
    
    def __init__(self):
        self.target_ranges = {
            'tds': {'min': 150, 'max': 300, 'optimal': 225},
            'ph': {'min': 6.5, 'max': 8.5, 'optimal': 7.2},
            'orp': {'min': 300, 'max': 600, 'optimal': 450},
            'turbidity': {'min': 0, 'max': 1.0, 'optimal': 0.2}
        }
    
    def get_optimization_recommendations(self, reading) -> Dict:
        """Get optimization recommendations"""
        recommendations = []
        actions = []
        
        # Extract values based on reading type
        if hasattr(reading, 'tds'):
            tds, ph, orp, turbidity = reading.tds, reading.ph, reading.orp, reading.turbidity
        else:
            tds = reading.get('tds', 250)
            ph = reading.get('ph', 7.2)
            orp = reading.get('orp', 400)
            turbidity = reading.get('turbidity', 0.3)
        
        # Simple optimization rules
        if tds > 300:
            recommendations.append("TDS high - increase RO filtration")
            actions.append({"type": "filter_adjustment", "parameter": "ro_pressure", "change": "+10%"})
        elif tds < 150:
            recommendations.append("TDS low - add mineral cartridge")
            actions.append({"type": "filter_adjustment", "parameter": "mineral_addition", "change": "enable"})
        
        if ph > 8.5:
            recommendations.append("pH high - activate acid injection")
            actions.append({"type": "chemical_dosing", "chemical": "acid", "amount": "low"})
        elif ph < 6.5:
            recommendations.append("pH low - activate alkaline injection")
            actions.append({"type": "chemical_dosing", "chemical": "alkaline", "amount": "low"})
        
        if orp < 300:
            recommendations.append("ORP low - increase disinfection")
            actions.append({"type": "disinfection", "method": "chlorine", "change": "+20%"})
        
        if turbidity > 1.0:
            recommendations.append("Turbidity high - backwash filters")
            actions.append({"type": "filter_maintenance", "action": "backwash"})
        
        if not recommendations:
            recommendations.append("Water quality within optimal ranges")
        
        quality_score = self._calculate_quality_score(tds, ph, orp, turbidity)
        
        return {
            "recommendations": recommendations,
            "actions": actions,
            "quality_score": quality_score,
            "overall_status": self._get_overall_status(quality_score)
        }
    
    def _calculate_quality_score(self, tds, ph, orp, turbidity) -> float:
        """Calculate simple quality score"""
        scores = []
        
        # TDS score
        if 150 <= tds <= 300:
            tds_score = 100
        else:
            tds_score = max(0, 100 - abs(tds - 225) / 2)
        scores.append(tds_score)
        
        # pH score
        if 6.5 <= ph <= 8.5:
            ph_score = 100
        else:
            ph_score = max(0, 100 - abs(ph - 7.2) * 20)
        scores.append(ph_score)
        
        # ORP score
        if 300 <= orp <= 600:
            orp_score = 100
        else:
            orp_score = max(0, 100 - abs(orp - 450) / 5)
        scores.append(orp_score)
        
        # Turbidity score
        if turbidity <= 1.0:
            turb_score = 100
        else:
            turb_score = max(0, 100 - (turbidity - 1.0) * 50)
        scores.append(turb_score)
        
        return round(sum(scores) / len(scores), 1)
    
    def _get_overall_status(self, score) -> str:
        """Get status based on score"""
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
filter_predictor = SimpleFilterPredictor()
anomaly_detector = SimpleAnomalyDetector()
quality_optimizer = SimpleWaterQualityOptimizer()

async def analyze_water_quality(readings: List, filter_usage_hours: float = 0, days_since_replacement: int = 0) -> Dict:
    """Simplified water quality analysis"""
    
    if not readings:
        return {"error": "No sensor readings provided"}
    
    latest_reading = readings[-1]
    
    # Run all analyses
    filter_analysis = filter_predictor.predict_saturation(readings, filter_usage_hours, days_since_replacement)
    anomalies = anomaly_detector.detect_anomalies(latest_reading)
    optimization = quality_optimizer.get_optimization_recommendations(latest_reading)
    
    # Generate alerts
    alerts = []
    
    if filter_analysis.get("replacement_needed"):
        alerts.append({
            "type": "filter_replacement",
            "severity": "high", 
            "message": f"Filter replacement needed (saturation: {filter_analysis.get('saturation_percent', 0)}%)"
        })
    
    for param, message in anomalies.items():
        alerts.append({
            "type": "sensor_anomaly",
            "severity": "high",
            "message": f"Anomaly in {param}: {message}"
        })
    
    if optimization.get("quality_score", 100) < 70:
        alerts.append({
            "type": "water_quality",
            "severity": "medium",
            "message": f"Water quality below target (score: {optimization.get('quality_score', 0)})"
        })
    
    return {
        "timestamp": datetime.now().isoformat(),
        "current_readings": latest_reading.to_dict() if hasattr(latest_reading, 'to_dict') else latest_reading,
        "filter_analysis": filter_analysis,
        "anomalies": anomalies,
        "optimization": optimization,
        "alerts": alerts
    }

if __name__ == "__main__":
    # Test the simplified ML models
    logger.info("Testing simplified ML models...")
    
    # Create test data
    test_reading = SimpleSensorReading(datetime.now(), 250, 7.2, 400, 0.3, 22)
    
    # Test filter prediction
    filter_result = filter_predictor.predict_saturation([test_reading], filter_usage_hours=200, days_since_replacement=30)
    print(f"Filter prediction: {filter_result}")
    
    # Test anomaly detection
    anomalies = anomaly_detector.detect_anomalies(test_reading)
    print(f"Anomalies: {anomalies}")
    
    # Test optimization
    optimization = quality_optimizer.get_optimization_recommendations(test_reading)
    print(f"Optimization: {optimization}")
    
    print("Simplified ML testing completed!") 