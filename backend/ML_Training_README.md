# AquaSentinel ML Training & Evaluation

This directory contains the machine learning training and evaluation components for the AquaSentinel water quality monitoring system.

## 📋 **Purpose**

The ML training system serves several key purposes:

### 🎯 **Main Objectives:**
1. **Train Water Quality Models** - Predict water potability from sensor readings
2. **Filter Saturation Prediction** - Predict when filters need replacement
3. **Anomaly Detection** - Identify unusual sensor patterns
4. **Performance Evaluation** - Generate metrics, visualizations, and reports
5. **Model Deployment** - Export trained models for production use

### 🔧 **Components:**

#### 1. **Water Quality Predictor** (`ml_utils.py`)
- **Purpose**: Determines if water is safe to drink (potable/non-potable)
- **Input**: 9 water quality parameters (pH, hardness, solids, chloramines, sulfate, conductivity, organic carbon, trihalomethanes, turbidity)
- **Output**: Potability classification with confidence score
- **Algorithm**: Random Forest Classifier

#### 2. **Filter Saturation Predictor** (`ml_model.py`)
- **Purpose**: Predicts when water filters need replacement
- **Input**: Sensor readings, usage hours, days since replacement
- **Output**: Saturation percentage (0-100%) and replacement timeline
- **Algorithm**: Random Forest Regression

#### 3. **Anomaly Detector** (`ml_model.py`)
- **Purpose**: Identifies unusual sensor readings indicating system issues
- **Input**: Real-time sensor readings
- **Output**: Anomaly alerts with severity levels
- **Algorithm**: Statistical analysis with baseline learning

## 🚀 **How to Run**

### **Option 1: Python Demo Script (Recommended)**
```bash
cd backend
python train_model_demo.py
```

**What it does:**
- ✅ Trains all ML models
- ✅ Generates performance metrics
- ✅ Creates visualizations and graphs
- ✅ Shows usage examples
- ✅ Saves trained models

### **Option 2: Jupyter Notebook**
```bash
cd backend
jupyter notebook train_model.ipynb
```

**What it provides:**
- 📊 Interactive training environment
- 📈 Step-by-step model development
- 📉 Real-time visualization
- 🎯 Performance analysis
- 💾 Model export capabilities

### **Option 3: Production Training**
```bash
# Train individual models
python -c "from ml_utils import WaterQualityPredictor; p = WaterQualityPredictor(); p.train_model(p.generate_synthetic_data())"
python -c "from ml_model import FilterSaturationPredictor; f = FilterSaturationPredictor(); f.train_model()"
```

## 📊 **Expected Outputs**

### **Training Results:**
- **Water Quality Model**: ~85-95% accuracy on test data
- **Filter Saturation Model**: RMSE < 5% for saturation predictions
- **Anomaly Detection**: High sensitivity to unusual patterns

### **Visualizations:**
1. **Feature Importance Charts** - Shows which water parameters matter most
2. **Confusion Matrices** - Classification performance breakdown
3. **Filter Saturation Curves** - Predicted degradation over time
4. **Anomaly Detection Plots** - Normal vs unusual readings
5. **Performance Metrics** - Accuracy, precision, recall, F1-score

### **Generated Files:**
- `model.pkl` - Trained water quality model
- `scaler.pkl` - Feature scaling transformer
- `models/filter_model.pkl` - Filter saturation predictor
- `model_metadata.json` - Training information and metrics

## 🎯 **Performance Metrics**

### **Key Evaluation Parameters:**
- **Accuracy**: Overall correctness of predictions
- **Precision**: Accuracy of positive predictions
- **Recall**: Ability to find all positive cases
- **F1-Score**: Balance between precision and recall
- **RMSE**: Root Mean Square Error for regression models
- **Feature Importance**: Which parameters contribute most to predictions

### **Benchmarks:**
- **Water Quality**: >90% accuracy target
- **Filter Saturation**: <5% prediction error
- **Anomaly Detection**: <1% false positive rate

## 📈 **Model Architecture**

### **Water Quality Model:**
```
Input: [pH, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity]
↓
StandardScaler (feature normalization)
↓
RandomForestClassifier (100 estimators, max_depth=10)
↓
Output: [potable/non-potable, confidence_score]
```

### **Filter Saturation Model:**
```
Input: [sensor_readings, usage_hours, days_since_replacement, flow_rate]
↓
Feature Engineering (trends, variances)
↓
RandomForestRegressor (100 estimators)
↓
Output: [saturation_percentage, days_until_replacement]
```

## 🔧 **Customization**

### **Hyperparameter Tuning:**
```python
# Water Quality Model
model = RandomForestClassifier(
    n_estimators=100,      # Number of trees
    max_depth=10,          # Maximum tree depth
    min_samples_split=5,   # Minimum samples to split
    random_state=42
)

# Filter Saturation Model
model = RandomForestRegressor(
    n_estimators=100,      # Number of trees
    max_depth=10,          # Maximum tree depth
    random_state=42
)
```

### **Data Sources:**
- **Synthetic Data**: Generated for training when real data unavailable
- **Real Sensor Data**: From AquaSentinel hardware sensors
- **Historical Data**: Previous readings for trend analysis

## 🚀 **Production Deployment**

### **Model Integration:**
1. **Backend API** (`app.py`): Serves ML predictions via REST endpoints
2. **Real-time Processing** (`main.py`): Processes live sensor data
3. **Firestore Storage**: Stores predictions and analysis results
4. **Frontend Display**: Shows predictions and recommendations

### **API Endpoints:**
- `POST /predict` - Water quality prediction
- `GET /ml/analyze` - Comprehensive water analysis
- `POST /train` - Retrain models with new data

## 📝 **Next Steps**

1. **Collect Real Data**: Replace synthetic data with actual sensor readings
2. **Model Monitoring**: Track performance in production
3. **Continuous Learning**: Retrain models with new data
4. **Feature Engineering**: Add more sophisticated features
5. **Ensemble Methods**: Combine multiple models for better accuracy

## 🎉 **Success Metrics**

- ✅ **High Accuracy**: >90% water quality prediction accuracy
- ✅ **Low Latency**: <100ms prediction response time
- ✅ **Reliable Alerts**: Accurate anomaly detection with minimal false positives
- ✅ **Predictive Maintenance**: Early filter replacement warnings
- ✅ **User Trust**: Consistent and explainable predictions

Your AquaSentinel ML models are designed to provide accurate, real-time water quality intelligence! 🚀 