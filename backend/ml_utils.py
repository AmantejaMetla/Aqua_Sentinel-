import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.impute import SimpleImputer
import joblib
import logging
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class WaterQualityPredictor:
    """Main class for water quality prediction using ML models"""
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = ['ph', 'hardness', 'solids', 'chloramines', 'sulfate', 'conductivity', 'organic_carbon', 'trihalomethanes', 'turbidity']
        self.target_name = 'potability'
        
    def get_default_model(self):
        """Get a default RandomForest model"""
        return RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2
        )
    
    def get_default_scaler(self):
        """Get a default StandardScaler"""
        return StandardScaler()
    
    def load_kaggle_data(self, file_path='water_potability.csv'):
        """Load water quality data from Kaggle dataset"""
        try:
            df = pd.read_csv(file_path)
            logger.info(f"Loaded dataset with shape: {df.shape}")
            return df
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            # Return synthetic data if file not found
            return self.generate_synthetic_data()
    
    def generate_synthetic_data(self, n_samples=1000):
        """Generate synthetic water quality data for training"""
        logger.info("Generating synthetic training data")
        
        np.random.seed(42)
        
        # Generate features with realistic distributions
        data = {
            'ph': np.random.normal(7.0, 1.5, n_samples),
            'hardness': np.random.normal(200, 50, n_samples),
            'solids': np.random.normal(20000, 5000, n_samples),
            'chloramines': np.random.normal(7, 2, n_samples),
            'sulfate': np.random.normal(250, 100, n_samples),
            'conductivity': np.random.normal(400, 100, n_samples),
            'organic_carbon': np.random.normal(14, 5, n_samples),
            'trihalomethanes': np.random.normal(70, 20, n_samples),
            'turbidity': np.random.normal(4, 2, n_samples)
        }
        
        # Create DataFrame
        df = pd.DataFrame(data)
        
        # Generate target based on realistic rules
        potability = []
        for _, row in df.iterrows():
            score = 0
            
            # pH should be between 6.5 and 8.5
            if 6.5 <= row['ph'] <= 8.5:
                score += 1
            
            # Turbidity should be low
            if row['turbidity'] < 5:
                score += 1
            
            # Hardness moderate levels
            if 100 <= row['hardness'] <= 300:
                score += 1
            
            # Chloramines should be reasonable
            if row['chloramines'] < 10:
                score += 1
            
            # Sulfate levels
            if row['sulfate'] < 400:
                score += 1
            
            # Conductivity
            if row['conductivity'] < 600:
                score += 1
            
            # Organic carbon
            if row['organic_carbon'] < 20:
                score += 1
            
            # Trihalomethanes
            if row['trihalomethanes'] < 100:
                score += 1
            
            # Solids
            if row['solids'] < 30000:
                score += 1
            
            # Determine potability based on score
            potability.append(1 if score >= 6 else 0)
        
        df['potability'] = potability
        
        # Add some noise to make it more realistic
        noise_indices = np.random.choice(df.index, size=int(0.1 * len(df)), replace=False)
        df.loc[noise_indices, 'potability'] = 1 - df.loc[noise_indices, 'potability']
        
        logger.info(f"Generated synthetic data with {len(df)} samples")
        logger.info(f"Potability distribution: {df['potability'].value_counts().to_dict()}")
        
        return df
    
    def preprocess_data(self, df):
        """Preprocess the data for training"""
        logger.info("Preprocessing data")
        
        # Handle missing values
        imputer = SimpleImputer(strategy='mean')
        
        # Separate features and target
        X = df[self.feature_names].copy()
        y = df[self.target_name].copy() if self.target_name in df.columns else None
        
        # Impute missing values
        X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=self.feature_names)
        
        # Scale features
        if self.scaler is None:
            self.scaler = StandardScaler()
        
        X_scaled = self.scaler.fit_transform(X_imputed)
        
        logger.info(f"Preprocessing completed. Shape: {X_scaled.shape}")
        
        return X_scaled, y
    
    def train_model(self, df):
        """Train the ML model"""
        logger.info("Starting model training")
        
        try:
            # Preprocess data
            X, y = self.preprocess_data(df)
            
            if y is None:
                raise ValueError("Target variable 'potability' not found in data")
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Initialize and train model
            self.model = self.get_default_model()
            self.model.fit(X_train, y_train)
            
            # Evaluate model
            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            
            # Generate classification report
            report = classification_report(y_test, y_pred, output_dict=True)
            
            # Feature importance
            feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))
            
            training_result = {
                'accuracy': accuracy,
                'classification_report': report,
                'feature_importance': feature_importance,
                'training_samples': len(X_train),
                'test_samples': len(X_test),
                'model_type': type(self.model).__name__
            }
            
            logger.info(f"Model training completed. Accuracy: {accuracy:.3f}")
            
            return training_result
            
        except Exception as e:
            logger.error(f"Error in model training: {str(e)}")
            raise
    
    def predict(self, features):
        """Make predictions"""
        if self.model is None:
            raise ValueError("Model not trained")
        
        if self.scaler is None:
            raise ValueError("Scaler not fitted")
        
        # Scale features
        scaled_features = self.scaler.transform(features)
        
        # Make prediction
        prediction = self.model.predict(scaled_features)
        prediction_proba = self.model.predict_proba(scaled_features)
        
        return prediction, prediction_proba
    
    def get_feature_importance(self):
        """Get feature importance from trained model"""
        if self.model is None:
            # Return default importance if model not trained
            return dict(zip(self.feature_names, [0.1] * len(self.feature_names)))
        
        if hasattr(self.model, 'feature_importances_'):
            return dict(zip(self.feature_names, self.model.feature_importances_))
        else:
            return dict(zip(self.feature_names, [0.1] * len(self.feature_names)))
    
    def calculate_quality_score(self, data):
        """Calculate overall water quality score"""
        score = 0
        max_score = 100
        
        # pH score (ideal: 6.5-8.5)
        ph = data.get('ph', 7)
        if 6.5 <= ph <= 8.5:
            score += 15
        elif 6.0 <= ph <= 9.0:
            score += 10
        elif 5.5 <= ph <= 9.5:
            score += 5
        
        # Turbidity score (lower is better)
        turbidity = data.get('turbidity', 4)
        if turbidity < 1:
            score += 15
        elif turbidity < 4:
            score += 10
        elif turbidity < 10:
            score += 5
        
        # Hardness score
        hardness = data.get('hardness', 200)
        if 100 <= hardness <= 300:
            score += 10
        elif 50 <= hardness <= 400:
            score += 7
        elif hardness <= 500:
            score += 3
        
        # Chloramines score
        chloramines = data.get('chloramines', 7)
        if chloramines < 4:
            score += 10
        elif chloramines < 8:
            score += 7
        elif chloramines < 12:
            score += 3
        
        # Sulfate score
        sulfate = data.get('sulfate', 250)
        if sulfate < 250:
            score += 10
        elif sulfate < 400:
            score += 7
        elif sulfate < 500:
            score += 3
        
        # Conductivity score
        conductivity = data.get('conductivity', 400)
        if conductivity < 300:
            score += 10
        elif conductivity < 500:
            score += 7
        elif conductivity < 700:
            score += 3
        
        # Organic carbon score
        organic_carbon = data.get('organic_carbon', 14)
        if organic_carbon < 10:
            score += 10
        elif organic_carbon < 20:
            score += 7
        elif organic_carbon < 25:
            score += 3
        
        # Trihalomethanes score
        trihalomethanes = data.get('trihalomethanes', 70)
        if trihalomethanes < 50:
            score += 10
        elif trihalomethanes < 100:
            score += 7
        elif trihalomethanes < 150:
            score += 3
        
        # Solids score
        solids = data.get('solids', 20000)
        if solids < 15000:
            score += 10
        elif solids < 25000:
            score += 7
        elif solids < 35000:
            score += 3
        
        return min(score, max_score)
    
    def generate_insights(self, data, prediction, confidence):
        """Generate insights based on prediction and data"""
        insights = []
        
        # Prediction insight
        if prediction == 1:
            insights.append(f"Water is predicted to be POTABLE with {confidence:.1f}% confidence")
        else:
            insights.append(f"Water is predicted to be NON-POTABLE with {confidence:.1f}% confidence")
        
        # Parameter-specific insights
        ph = data.get('ph', 7)
        if ph < 6.5:
            insights.append("pH level is too acidic - may cause corrosion")
        elif ph > 8.5:
            insights.append("pH level is too alkaline - may cause scaling")
        
        turbidity = data.get('turbidity', 4)
        if turbidity > 4:
            insights.append("High turbidity detected - indicates possible contamination")
        
        chloramines = data.get('chloramines', 7)
        if chloramines > 10:
            insights.append("High chloramine levels - may affect taste and odor")
        
        hardness = data.get('hardness', 200)
        if hardness > 300:
            insights.append("High water hardness - may cause scaling in pipes")
        
        sulfate = data.get('sulfate', 250)
        if sulfate > 400:
            insights.append("High sulfate levels - may cause laxative effects")
        
        trihalomethanes = data.get('trihalomethanes', 70)
        if trihalomethanes > 100:
            insights.append("High trihalomethane levels - potential health concern")
        
        return insights
    
    def generate_recommendations(self, analysis):
        """Generate recommendations based on analysis"""
        recommendations = []
        
        # Add general recommendations
        recommendations.append("Regular water quality monitoring is recommended")
        recommendations.append("Consider installing appropriate filtration systems")
        recommendations.append("Maintain proper pH levels between 6.5-8.5")
        recommendations.append("Monitor turbidity levels regularly")
        recommendations.append("Test for chemical contaminants periodically")
        
        return recommendations

class DataProcessor:
    """Class for data processing and analysis"""
    
    def __init__(self):
        self.feature_names = ['ph', 'hardness', 'solids', 'chloramines', 'sulfate', 'conductivity', 'organic_carbon', 'trihalomethanes', 'turbidity']
    
    def analyze_data(self, df):
        """Analyze water quality data"""
        analysis = {}
        
        # Basic statistics
        analysis['basic_stats'] = {
            'total_samples': len(df),
            'features': len(df.columns),
            'missing_values': df.isnull().sum().to_dict()
        }
        
        # Statistical summary
        analysis['statistical_summary'] = df.describe().to_dict()
        
        # Correlation analysis
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        if len(numeric_columns) > 1:
            correlation_matrix = df[numeric_columns].corr()
            analysis['correlations'] = correlation_matrix.to_dict()
        
        # Quality distribution if available
        if 'potability' in df.columns:
            analysis['quality_distribution'] = df['potability'].value_counts().to_dict()
        
        return analysis
    
    def detect_anomalies(self, df):
        """Detect anomalies in water quality data"""
        anomalies = []
        
        for feature in self.feature_names:
            if feature in df.columns:
                # Calculate z-score
                mean = df[feature].mean()
                std = df[feature].std()
                
                if std > 0:
                    z_scores = np.abs((df[feature] - mean) / std)
                    anomaly_indices = z_scores > 3
                    
                    if anomaly_indices.any():
                        anomalies.append({
                            'feature': feature,
                            'anomaly_count': int(anomaly_indices.sum()),
                            'anomaly_percentage': float(anomaly_indices.mean() * 100),
                            'threshold': 3.0,
                            'method': 'z-score'
                        })
        
        return anomalies
    
    def prepare_training_data(self, df):
        """Prepare data for model training"""
        # Remove duplicates
        df_clean = df.drop_duplicates()
        
        # Handle missing values
        imputer = SimpleImputer(strategy='mean')
        numeric_columns = df_clean.select_dtypes(include=[np.number]).columns
        df_clean[numeric_columns] = imputer.fit_transform(df_clean[numeric_columns])
        
        return df_clean
    
    def export_results(self, results, filename='analysis_results.json'):
        """Export analysis results to JSON file"""
        import json
        
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        logger.info(f"Results exported to {filename}")

# Utility functions
def load_model_from_file(model_path='model.pkl'):
    """Load trained model from file"""
    try:
        model = joblib.load(model_path)
        logger.info("Model loaded from file")
        return model
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return None

def save_model_to_file(model, model_path='model.pkl'):
    """Save trained model to file"""
    try:
        joblib.dump(model, model_path)
        logger.info(f"Model saved to {model_path}")
    except Exception as e:
        logger.error(f"Error saving model: {str(e)}")

def validate_input_data(data):
    """Validate input data for prediction"""
    required_fields = ['ph', 'hardness', 'solids', 'chloramines', 'sulfate', 'conductivity', 'organic_carbon', 'trihalomethanes', 'turbidity']
    
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        raise ValueError(f"Missing required fields: {missing_fields}")
    
    # Validate ranges
    validations = {
        'ph': (0, 14),
        'hardness': (0, 1000),
        'solids': (0, 50000),
        'chloramines': (0, 20),
        'sulfate': (0, 1000),
        'conductivity': (0, 2000),
        'organic_carbon': (0, 50),
        'trihalomethanes': (0, 200),
        'turbidity': (0, 20)
    }
    
    for field, (min_val, max_val) in validations.items():
        if field in data:
            value = data[field]
            if not (min_val <= value <= max_val):
                raise ValueError(f"{field} value {value} is outside valid range [{min_val}, {max_val}]")
    
    return True 