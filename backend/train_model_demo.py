#!/usr/bin/env python3
"""
AquaSentinel ML Model Training & Evaluation Demo
This script demonstrates training and evaluation of all ML models with visualizations.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# ML imports
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib

# Local imports
from ml_utils import WaterQualityPredictor, DataProcessor
from ml_model import FilterSaturationPredictor, AnomalyDetector
from sensors import SensorReading

def main():
    print("🚀 AquaSentinel ML Model Training & Evaluation")
    print("=" * 60)
    print(f"📊 Started at: {datetime.now()}")
    
    # Set up plotting
    plt.style.use('seaborn-v0_8' if 'seaborn-v0_8' in plt.style.available else 'default')
    sns.set_palette("husl")
    plt.rcParams['figure.figsize'] = (12, 8)
    
    # 1. Water Quality Prediction Model
    print("\n🔹 1. WATER QUALITY PREDICTION MODEL")
    print("-" * 40)
    
    # Initialize predictor
    predictor = WaterQualityPredictor()
    
    # Generate synthetic data
    print("📈 Generating training data...")
    df = predictor.generate_synthetic_data(n_samples=2000)
    
    print(f"📊 Dataset shape: {df.shape}")
    print(f"🎯 Target distribution:")
    print(df['potability'].value_counts())
    
    # Train model
    print("\n🚀 Training Water Quality Model...")
    training_result = predictor.train_model(df)
    
    print(f"✅ Accuracy: {training_result['accuracy']:.3f}")
    print(f"📈 Training samples: {training_result['training_samples']}")
    print(f"📉 Test samples: {training_result['test_samples']}")
    
    # Feature importance visualization
    feature_importance = training_result['feature_importance']
    
    plt.figure(figsize=(12, 6))
    features = list(feature_importance.keys())
    importances = list(feature_importance.values())
    
    # Sort by importance
    sorted_idx = np.argsort(importances)[::-1]
    features = [features[i] for i in sorted_idx]
    importances = [importances[i] for i in sorted_idx]
    
    bars = plt.bar(features, importances, color='skyblue', alpha=0.8)
    plt.title('Feature Importance - Water Quality Prediction', fontsize=16)
    plt.xlabel('Features', fontsize=12)
    plt.ylabel('Importance', fontsize=12)
    plt.xticks(rotation=45, ha='right')
    plt.grid(True, alpha=0.3)
    
    # Add value labels
    for bar, importance in zip(bars, importances):
        plt.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.001,
                f'{importance:.3f}', ha='center', va='bottom')
    
    plt.tight_layout()
    plt.show()
    
    # 2. Filter Saturation Prediction Model
    print("\n🔹 2. FILTER SATURATION PREDICTION MODEL")
    print("-" * 40)
    
    # Initialize filter predictor
    filter_predictor = FilterSaturationPredictor()
    
    print("🔧 Training Filter Saturation Model...")
    filter_predictor.train_model(force_retrain=True)
    
    # Test scenarios
    scenarios = {
        'New Filter (Day 1)': {
            'days': 1,
            'usage_hours': 8,
            'readings': [SensorReading(datetime.now(), 180, 7.3, 420, 0.15, 22)]
        },
        'Medium Usage (Day 30)': {
            'days': 30,
            'usage_hours': 300,
            'readings': [SensorReading(datetime.now(), 220, 7.1, 380, 0.35, 22)]
        },
        'High Usage (Day 60)': {
            'days': 60,
            'usage_hours': 720,
            'readings': [SensorReading(datetime.now(), 280, 6.9, 340, 0.8, 23)]
        },
        'Replacement Needed (Day 90)': {
            'days': 90,
            'usage_hours': 1080,
            'readings': [SensorReading(datetime.now(), 350, 6.5, 300, 1.2, 24)]
        }
    }
    
    # Test predictions
    results = []
    for scenario_name, scenario_data in scenarios.items():
        prediction = filter_predictor.predict_saturation(
            scenario_data['readings'],
            scenario_data['usage_hours'],
            scenario_data['days']
        )
        
        results.append({
            'scenario': scenario_name,
            'days': scenario_data['days'],
            'saturation': prediction['saturation_percent'],
            'replacement_needed': prediction['replacement_needed']
        })
    
    # Display results
    results_df = pd.DataFrame(results)
    print("\n📈 Filter Saturation Predictions:")
    print(results_df.to_string(index=False))
    
    # Visualize filter saturation progression
    plt.figure(figsize=(12, 6))
    plt.plot(results_df['days'], results_df['saturation'], 'o-', linewidth=2, markersize=8)
    plt.axhline(y=80, color='r', linestyle='--', label='Replacement Threshold (80%)')
    plt.xlabel('Days Since Filter Installation')
    plt.ylabel('Filter Saturation (%)')
    plt.title('Filter Saturation Progression Over Time')
    plt.grid(True, alpha=0.3)
    plt.legend()
    
    # Add scenario labels
    for i, row in results_df.iterrows():
        plt.annotate(f"{row['saturation']:.1f}%", 
                    (row['days'], row['saturation']), 
                    textcoords="offset points", 
                    xytext=(0,10), 
                    ha='center')
    
    plt.tight_layout()
    plt.show()
    
    # 3. Anomaly Detection Model
    print("\n🔹 3. ANOMALY DETECTION MODEL")
    print("-" * 40)
    
    # Initialize anomaly detector
    anomaly_detector = AnomalyDetector()
    
    print("🔍 Setting up Anomaly Detection...")
    
    # Generate normal baseline
    normal_readings = []
    for i in range(100):
        reading = SensorReading(
            datetime.now() - timedelta(hours=i),
            tds=np.random.normal(200, 20),
            ph=np.random.normal(7.2, 0.3),
            orp=np.random.normal(400, 50),
            turbidity=np.random.normal(0.3, 0.1),
            temperature=np.random.normal(22, 1)
        )
        normal_readings.append(reading)
    
    # Update baseline
    anomaly_detector.update_baseline(normal_readings)
    
    # Test readings (normal and anomalous)
    test_readings = [
        SensorReading(datetime.now(), 195, 7.1, 410, 0.25, 21.5),  # Normal
        SensorReading(datetime.now(), 205, 7.3, 390, 0.35, 22.5),  # Normal
        SensorReading(datetime.now(), 500, 5.5, 200, 2.0, 30),     # Anomalous
        SensorReading(datetime.now(), 150, 9.0, 600, 0.1, 15),     # Anomalous
        SensorReading(datetime.now(), 100, 7.0, 100, 5.0, 25),     # Anomalous
    ]
    
    # Test anomaly detection
    anomaly_results = []
    for i, reading in enumerate(test_readings):
        anomalies = anomaly_detector.detect_anomalies(reading)
        anomaly_results.append({
            'reading_id': i+1,
            'tds': reading.tds,
            'ph': reading.ph,
            'turbidity': reading.turbidity,
            'anomalies_detected': len(anomalies) > 0,
            'anomaly_count': len(anomalies)
        })
    
    # Display results
    print("\n🚨 Anomaly Detection Results:")
    for result in anomaly_results:
        status = "🔴 ANOMALY" if result['anomalies_detected'] else "🟢 NORMAL"
        print(f"Reading {result['reading_id']}: {status}")
        print(f"  TDS: {result['tds']:.1f}, pH: {result['ph']:.1f}, Turbidity: {result['turbidity']:.2f}")
    
    # Visualize anomaly detection
    fig, axes = plt.subplots(1, 3, figsize=(15, 5))
    parameters = ['tds', 'ph', 'turbidity']
    colors = ['green' if not result['anomalies_detected'] else 'red' for result in anomaly_results]
    
    for i, param in enumerate(parameters):
        values = [result[param] for result in anomaly_results]
        reading_ids = [result['reading_id'] for result in anomaly_results]
        
        axes[i].scatter(reading_ids, values, c=colors, s=100, alpha=0.7)
        axes[i].set_xlabel('Reading ID')
        axes[i].set_ylabel(param.upper())
        axes[i].set_title(f'{param.upper()} Values')
        axes[i].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()
    
    # 4. Model Performance Summary
    print("\n🔹 4. MODEL PERFORMANCE SUMMARY")
    print("-" * 40)
    
    print(f"✅ Water Quality Model Accuracy: {training_result['accuracy']:.3f}")
    print(f"✅ Filter Saturation Model: {'Trained' if filter_predictor.is_trained else 'Not Trained'}")
    
    normal_count = sum(1 for r in anomaly_results if not r['anomalies_detected'])
    anomaly_count = sum(1 for r in anomaly_results if r['anomalies_detected'])
    print(f"✅ Anomaly Detection: {anomaly_count}/{len(anomaly_results)} anomalies detected")
    
    # Save models
    print("\n💾 Saving models...")
    try:
        joblib.dump(predictor.model, 'model.pkl')
        joblib.dump(predictor.scaler, 'scaler.pkl')
        print("✅ Models saved successfully!")
    except Exception as e:
        print(f"❌ Error saving models: {e}")
    
    # Usage examples
    print("\n🔹 5. USAGE EXAMPLES")
    print("-" * 40)
    
    # Example 1: Water Quality Prediction
    print("🔬 Example: Water Quality Prediction")
    sample_water = {
        'ph': 7.2,
        'hardness': 180,
        'solids': 18000,
        'chloramines': 6.5,
        'sulfate': 240,
        'conductivity': 420,
        'organic_carbon': 12,
        'trihalomethanes': 65,
        'turbidity': 0.4
    }
    
    features = np.array([[sample_water[col] for col in predictor.feature_names]])
    scaled_features = predictor.scaler.transform(features)
    prediction = predictor.model.predict(scaled_features)[0]
    prediction_proba = predictor.model.predict_proba(scaled_features)[0]
    
    print(f"Input: pH={sample_water['ph']}, TDS={sample_water['solids']}, Turbidity={sample_water['turbidity']}")
    print(f"Prediction: {'✅ Potable' if prediction == 1 else '❌ Non-potable'}")
    print(f"Confidence: {max(prediction_proba)*100:.1f}%")
    
    print("\n🎉 Training and evaluation completed successfully!")
    print("🚀 Your AquaSentinel ML models are ready for deployment!")

if __name__ == "__main__":
    main() 