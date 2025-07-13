from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime, timedelta
import logging
from ml_utils import WaterQualityPredictor, DataProcessor
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure CORS for production
CORS(app, origins=[
    "http://localhost:5173",  # Local development (Vite)
    "http://localhost:3000",  # Alternative local
    "http://192.168.1.11:3000",  # Local network IP
    "http://127.0.0.1:3000",  # Local IP alternative
    "https://*.netlify.app",  # Netlify deployment
    "https://*.vercel.app",   # Vercel deployment  
    "https://*.onrender.com", # Render.com deployment
    "https://aquasentinel.netlify.app",  # Your specific domain
    "https://main--aquasentinel.netlify.app",  # Netlify preview URLs
])

# Initialize ML models
water_quality_predictor = WaterQualityPredictor()
data_processor = DataProcessor()

# Global variables for model and scaler
model = None
scaler = None
feature_names = ['ph', 'hardness', 'solids', 'chloramines', 'sulfate', 'conductivity', 'organic_carbon', 'trihalomethanes', 'turbidity']

def load_model():
    """Load the trained model and scaler"""
    global model, scaler
    try:
        if os.path.exists('model.pkl'):
            model = joblib.load('model.pkl')
            logger.info("Model loaded successfully")
        else:
            logger.warning("Model file not found, using default predictor")
            model = water_quality_predictor.get_default_model()
            
        if os.path.exists('scaler.pkl'):
            scaler = joblib.load('scaler.pkl')
            logger.info("Scaler loaded successfully")
        else:
            logger.warning("Scaler file not found, using default scaler")
            scaler = water_quality_predictor.get_default_scaler()
            
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        model = water_quality_predictor.get_default_model()
        scaler = water_quality_predictor.get_default_scaler()

# Load model on startup
load_model()

# Health check endpoint for Railway
@app.route('/health')
def health_check():
    """Health check endpoint for deployment monitoring"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'AquaSentinel Backend API'
    }), 200

@app.route('/predict', methods=['POST'])
def predict():
    """Predict water quality based on input parameters"""
    try:
        # Get input data
        input_data = request.json
        logger.info(f"Received prediction request: {input_data}")
        
        # Validate input
        required_fields = ['ph', 'turbidity', 'conductivity', 'hardness', 'solids', 'chloramines', 'sulfate', 'organic_carbon', 'trihalomethanes']
        missing_fields = [field for field in required_fields if field not in input_data]
        
        if missing_fields:
            return jsonify({
                'status': 'error',
                'message': f'Missing required fields: {missing_fields}'
            }), 400
        
        # Prepare data for prediction
        features = np.array([[
            input_data['ph'],
            input_data['hardness'],
            input_data['solids'],
            input_data['chloramines'],
            input_data['sulfate'],
            input_data['conductivity'],
            input_data['organic_carbon'],
            input_data['trihalomethanes'],
            input_data['turbidity']
        ]])
        
        # Scale features
        scaled_features = scaler.transform(features)
        
        # Make prediction
        prediction = model.predict(scaled_features)[0]
        prediction_proba = model.predict_proba(scaled_features)[0]
        
        # Calculate confidence
        confidence = float(np.max(prediction_proba) * 100)
        
        # Determine quality status
        quality_status = "Potable" if prediction == 1 else "Non-potable"
        
        # Generate insights
        insights = water_quality_predictor.generate_insights(input_data, prediction, confidence)
        
        # Calculate quality score
        quality_score = water_quality_predictor.calculate_quality_score(input_data)
        
        result = {
            'status': 'success',
            'prediction': int(prediction),
            'quality_status': quality_status,
            'confidence': confidence,
            'quality_score': quality_score,
            'insights': insights,
            'timestamp': datetime.now().isoformat(),
            'input_data': input_data
        }
        
        logger.info(f"Prediction result: {result}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    """Analyze water quality data and provide detailed insights"""
    try:
        input_data = request.json
        logger.info(f"Received analysis request: {input_data}")
        
        # Validate input
        if 'data' not in input_data:
            return jsonify({
                'status': 'error',
                'message': 'Missing data field'
            }), 400
        
        data = input_data['data']
        
        # Process data
        df = pd.DataFrame(data)
        analysis = data_processor.analyze_data(df)
        
        # Feature importance
        feature_importance = water_quality_predictor.get_feature_importance()
        
        # Generate recommendations
        recommendations = water_quality_predictor.generate_recommendations(analysis)
        
        # Anomaly detection
        anomalies = data_processor.detect_anomalies(df)
        
        result = {
            'status': 'success',
            'analysis': analysis,
            'feature_importance': feature_importance,
            'recommendations': recommendations,
            'anomalies': anomalies,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in analysis: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/train', methods=['POST'])
def train():
    """Train or retrain the ML model"""
    try:
        input_data = request.json
        logger.info("Received training request")
        
        # Check if training data is provided
        if 'training_data' not in input_data:
            return jsonify({
                'status': 'error',
                'message': 'No training data provided'
            }), 400
        
        training_data = input_data['training_data']
        
        # Convert to DataFrame
        df = pd.DataFrame(training_data)
        
        # Train model
        training_result = water_quality_predictor.train_model(df)
        
        # Save model and scaler
        joblib.dump(water_quality_predictor.model, 'model.pkl')
        joblib.dump(water_quality_predictor.scaler, 'scaler.pkl')
        
        # Reload the global model and scaler
        load_model()
        
        result = {
            'status': 'success',
            'training_result': training_result,
            'timestamp': datetime.now().isoformat()
        }
        
        logger.info("Model training completed successfully")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in training: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about the current model"""
    try:
        info = {
            'status': 'success',
            'model_type': type(model).__name__ if model else 'None',
            'feature_names': feature_names,
            'model_loaded': model is not None,
            'scaler_loaded': scaler is not None,
            'feature_importance': water_quality_predictor.get_feature_importance() if model else None,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(info)
        
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Batch prediction for multiple samples"""
    try:
        input_data = request.json
        logger.info(f"Received batch prediction request for {len(input_data.get('samples', []))} samples")
        
        if 'samples' not in input_data:
            return jsonify({
                'status': 'error',
                'message': 'No samples provided'
            }), 400
        
        samples = input_data['samples']
        results = []
        
        for sample in samples:
            # Prepare features
            features = np.array([[
                sample['ph'],
                sample['hardness'],
                sample['solids'],
                sample['chloramines'],
                sample['sulfate'],
                sample['conductivity'],
                sample['organic_carbon'],
                sample['trihalomethanes'],
                sample['turbidity']
            ]])
            
            # Scale and predict
            scaled_features = scaler.transform(features)
            prediction = model.predict(scaled_features)[0]
            prediction_proba = model.predict_proba(scaled_features)[0]
            confidence = float(np.max(prediction_proba) * 100)
            
            results.append({
                'prediction': int(prediction),
                'quality_status': "Potable" if prediction == 1 else "Non-potable",
                'confidence': confidence,
                'quality_score': water_quality_predictor.calculate_quality_score(sample),
                'input_data': sample
            })
        
        return jsonify({
            'status': 'success',
            'results': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in batch prediction: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/sensors/current', methods=['GET'])
def get_current_sensor_data():
    """Get current sensor readings"""
    try:
        # Generate realistic sensor data
        import random
        import time
        
        current_data = {
            'tds': round(200 + random.uniform(-50, 50), 2),
            'ph': round(7.0 + random.uniform(-0.5, 0.5), 2),
            'orp': round(450 + random.uniform(-100, 100), 2),
            'turbidity': round(0.5 + random.uniform(-0.2, 0.2), 3),
            'temperature': round(22 + random.uniform(-2, 2), 2),
            'timestamp': datetime.now().isoformat(),
            'quality_status': 'excellent'
        }
        
        return jsonify(current_data)
    except Exception as e:
        logger.error(f"Error getting current sensor data: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/sensors/history', methods=['GET'])
def get_sensor_history():
    """Get historical sensor data"""
    try:
        hours = int(request.args.get('hours', 24))
        
        # Generate historical data
        import random
        from datetime import datetime, timedelta
        
        history = []
        now = datetime.now()
        
        for i in range(hours):
            timestamp = now - timedelta(hours=i)
            reading = {
                'tds': round(200 + random.uniform(-50, 50), 2),
                'ph': round(7.0 + random.uniform(-0.5, 0.5), 2),
                'orp': round(450 + random.uniform(-100, 100), 2),
                'turbidity': round(0.5 + random.uniform(-0.2, 0.2), 3),
                'temperature': round(22 + random.uniform(-2, 2), 2),
                'timestamp': timestamp.isoformat(),
                'quality_status': 'excellent'
            }
            history.append(reading)
        
        return jsonify(history)
    except Exception as e:
        logger.error(f"Error getting sensor history: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/ml/analyze', methods=['GET'])
def get_ml_analysis():
    """Get ML analysis results"""
    try:
        hours = int(request.args.get('hours', 24))
        tds = float(request.args.get('tds', 200))
        ph = float(request.args.get('ph', 7.0))
        
        # Generate ML analysis
        import random
        
        analysis = {
            'filter_saturation': round(random.uniform(30, 70), 1),
            'days_remaining': random.randint(10, 30),
            'confidence': round(random.uniform(0.85, 0.98), 3),
            'efficiency': round(random.uniform(80, 95), 1),
            'recommendations': [
                'Filter replacement recommended in 2 weeks',
                'pH levels are optimal',
                'TDS within acceptable range'
            ],
            'timestamp': datetime.now().isoformat(),
            'parameters': {
                'hours': hours,
                'tds': tds,
                'ph': ph
            }
        }
        
        return jsonify(analysis)
    except Exception as e:
        logger.error(f"Error getting ML analysis: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Load model on startup
    load_model()
    
    # Get port from environment variable (for Render.com deployment)
    port = int(os.environ.get('PORT', 8000))
    app.run(debug=True, host='0.0.0.0', port=port) 