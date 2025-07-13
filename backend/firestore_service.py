"""
Firestore Database Service for AquaSentinel Backend
Handles all database operations with Firebase Firestore
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import asdict
import asyncio

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("Firebase Admin SDK not available. Install with: pip install firebase-admin")

from sensors import SensorReading

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FirestoreService:
    """Service for handling Firestore database operations"""
    
    def __init__(self, project_id: str = "aquasentinel-8b5e9"):
        self.project_id = project_id
        self.db = None
        self.initialized = False
        
        # Collection names
        self.collections = {
            'sensor_readings': 'sensor_readings',
            'alerts': 'alerts',
            'user_settings': 'user_settings',
            'system_config': 'system_config',
            'ml_analysis': 'ml_analysis',
            'control_actions': 'control_actions',
            'maintenance_logs': 'maintenance_logs'
        }
        
        self._initialize_firestore()
    
    def _initialize_firestore(self):
        """Initialize Firestore connection"""
        if not FIREBASE_AVAILABLE:
            logger.warning("Firebase Admin SDK not available, using mock implementation")
            self.db = None
            return
        
        try:
            # Check if Firebase app is already initialized
            if not firebase_admin._apps:
                # Try to initialize with service account key
                service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH', './service-account-key.json')
                
                if os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred, {
                        'projectId': self.project_id
                    })
                    logger.info("Firebase initialized with service account")
                else:
                    # Try to initialize with default credentials
                    firebase_admin.initialize_app()
                    logger.info("Firebase initialized with default credentials")
            
            self.db = firestore.client()
            self.initialized = True
            logger.info("Firestore service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Firestore: {e}")
            self.db = None
            self.initialized = False
    
    def _get_timestamp(self) -> datetime:
        """Get current timestamp"""
        return datetime.now()
    
    def _prepare_sensor_data(self, reading: SensorReading, user_id: str = "system") -> Dict:
        """Prepare sensor reading data for Firestore"""
        data = asdict(reading)
        data.update({
            'userId': user_id,
            'timestamp': firestore.SERVER_TIMESTAMP if self.db else self._get_timestamp(),
            'createdAt': reading.timestamp.isoformat(),
            'quality_status': self._determine_quality_status(reading)
        })
        return data
    
    def _determine_quality_status(self, reading: SensorReading) -> str:
        """Determine water quality status based on sensor readings"""
        if reading.ph < 6.5 or reading.ph > 8.5:
            return 'poor'
        elif reading.tds > 500:
            return 'poor'
        elif reading.turbidity > 4:
            return 'poor'
        elif reading.ph < 7.0 or reading.ph > 8.0:
            return 'fair'
        elif reading.tds > 300:
            return 'fair'
        elif reading.turbidity > 1:
            return 'fair'
        else:
            return 'excellent'
    
    # SENSOR READINGS
    async def save_sensor_reading(self, reading: SensorReading, user_id: str = "system") -> Optional[str]:
        """Save sensor reading to Firestore"""
        if not self.initialized:
            logger.warning("Firestore not initialized, skipping save")
            return None
        
        try:
            data = self._prepare_sensor_data(reading, user_id)
            doc_ref = self.db.collection(self.collections['sensor_readings']).add(data)
            
            # doc_ref is a tuple (timestamp, document_reference)
            doc_id = doc_ref[1].id
            logger.info(f"Sensor reading saved with ID: {doc_id}")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error saving sensor reading: {e}")
            return None
    
    async def get_sensor_readings(self, hours: int = 24, limit: int = 100, user_id: str = "system") -> List[Dict]:
        """Get sensor readings from Firestore"""
        if not self.initialized:
            logger.warning("Firestore not initialized, returning empty list")
            return []
        
        try:
            hours_ago = datetime.now() - timedelta(hours=hours)
            
            query = (self.db.collection(self.collections['sensor_readings'])
                    .where('userId', '==', user_id)
                    .where('createdAt', '>=', hours_ago.isoformat())
                    .order_by('createdAt', direction=firestore.Query.DESCENDING)
                    .limit(limit))
            
            docs = query.stream()
            readings = []
            
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                readings.append(data)
            
            logger.info(f"Retrieved {len(readings)} sensor readings")
            return readings
            
        except Exception as e:
            logger.error(f"Error getting sensor readings: {e}")
            return []
    
    async def get_latest_sensor_reading(self, user_id: str = "system") -> Optional[Dict]:
        """Get the latest sensor reading"""
        if not self.initialized:
            return None
        
        try:
            query = (self.db.collection(self.collections['sensor_readings'])
                    .where('userId', '==', user_id)
                    .order_by('createdAt', direction=firestore.Query.DESCENDING)
                    .limit(1))
            
            docs = list(query.stream())
            if docs:
                data = docs[0].to_dict()
                data['id'] = docs[0].id
                return data
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting latest sensor reading: {e}")
            return None
    
    # ALERTS
    async def save_alert(self, alert_type: str, message: str, severity: str = "warning", 
                        user_id: str = "system", metadata: Dict = None) -> Optional[str]:
        """Save alert to Firestore"""
        if not self.initialized:
            logger.warning("Firestore not initialized, skipping alert save")
            return None
        
        try:
            data = {
                'type': alert_type,
                'message': message,
                'severity': severity,
                'userId': user_id,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'createdAt': self._get_timestamp().isoformat(),
                'isRead': False,
                'isResolved': False,
                'metadata': metadata or {}
            }
            
            doc_ref = self.db.collection(self.collections['alerts']).add(data)
            doc_id = doc_ref[1].id
            logger.info(f"Alert saved with ID: {doc_id}")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error saving alert: {e}")
            return None
    
    async def get_alerts(self, limit: int = 50, user_id: str = "system", 
                        unresolved_only: bool = False) -> List[Dict]:
        """Get alerts from Firestore"""
        if not self.initialized:
            return []
        
        try:
            query = (self.db.collection(self.collections['alerts'])
                    .where('userId', '==', user_id)
                    .order_by('createdAt', direction=firestore.Query.DESCENDING)
                    .limit(limit))
            
            if unresolved_only:
                query = query.where('isResolved', '==', False)
            
            docs = query.stream()
            alerts = []
            
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                alerts.append(data)
            
            return alerts
            
        except Exception as e:
            logger.error(f"Error getting alerts: {e}")
            return []
    
    # CONTROL ACTIONS
    async def save_control_action(self, device: str, command: str, status: str = "executed", 
                                 user_id: str = "system", metadata: Dict = None) -> Optional[str]:
        """Save control action to Firestore"""
        if not self.initialized:
            return None
        
        try:
            data = {
                'device': device,
                'command': command,
                'status': status,
                'userId': user_id,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'createdAt': self._get_timestamp().isoformat(),
                'metadata': metadata or {}
            }
            
            doc_ref = self.db.collection(self.collections['control_actions']).add(data)
            doc_id = doc_ref[1].id
            logger.info(f"Control action saved with ID: {doc_id}")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error saving control action: {e}")
            return None
    
    # ML ANALYSIS
    async def save_ml_analysis(self, analysis_data: Dict, user_id: str = "system") -> Optional[str]:
        """Save ML analysis to Firestore"""
        if not self.initialized:
            return None
        
        try:
            data = {
                **analysis_data,
                'userId': user_id,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'createdAt': self._get_timestamp().isoformat()
            }
            
            doc_ref = self.db.collection(self.collections['ml_analysis']).add(data)
            doc_id = doc_ref[1].id
            logger.info(f"ML analysis saved with ID: {doc_id}")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error saving ML analysis: {e}")
            return None
    
    # SYSTEM CONFIG
    async def get_system_config(self) -> Dict:
        """Get system configuration from Firestore"""
        if not self.initialized:
            return {}
        
        try:
            docs = self.db.collection(self.collections['system_config']).stream()
            config = {}
            
            for doc in docs:
                config[doc.id] = doc.to_dict()
            
            return config
            
        except Exception as e:
            logger.error(f"Error getting system config: {e}")
            return {}
    
    async def update_system_config(self, config_key: str, config_value: Any) -> bool:
        """Update system configuration"""
        if not self.initialized:
            return False
        
        try:
            doc_ref = self.db.collection(self.collections['system_config']).document(config_key)
            doc_ref.set({
                'value': config_value,
                'updatedAt': firestore.SERVER_TIMESTAMP
            })
            
            logger.info(f"System config updated: {config_key}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating system config: {e}")
            return False
    
    # BATCH OPERATIONS
    async def batch_save_sensor_readings(self, readings: List[SensorReading], 
                                       user_id: str = "system") -> bool:
        """Batch save multiple sensor readings"""
        if not self.initialized:
            return False
        
        try:
            batch = self.db.batch()
            
            for reading in readings:
                data = self._prepare_sensor_data(reading, user_id)
                doc_ref = self.db.collection(self.collections['sensor_readings']).document()
                batch.set(doc_ref, data)
            
            batch.commit()
            logger.info(f"Batch saved {len(readings)} sensor readings")
            return True
            
        except Exception as e:
            logger.error(f"Error batch saving sensor readings: {e}")
            return False
    
    # CLEANUP
    async def cleanup_old_data(self, days: int = 30) -> bool:
        """Clean up old data from Firestore"""
        if not self.initialized:
            return False
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Clean up old sensor readings
            query = (self.db.collection(self.collections['sensor_readings'])
                    .where('createdAt', '<', cutoff_date.isoformat())
                    .limit(100))
            
            docs = query.stream()
            batch = self.db.batch()
            
            for doc in docs:
                batch.delete(doc.reference)
            
            batch.commit()
            logger.info("Old data cleanup completed")
            return True
            
        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")
            return False
    
    # HEALTH CHECK
    def health_check(self) -> Dict:
        """Check Firestore connection health"""
        return {
            'firestore_initialized': self.initialized,
            'firestore_available': FIREBASE_AVAILABLE,
            'project_id': self.project_id,
            'collections': self.collections
        }

# Global instance
firestore_service = FirestoreService()

# Export convenience functions
async def save_sensor_reading(reading: SensorReading, user_id: str = "system") -> Optional[str]:
    return await firestore_service.save_sensor_reading(reading, user_id)

async def get_sensor_readings(hours: int = 24, limit: int = 100, user_id: str = "system") -> List[Dict]:
    return await firestore_service.get_sensor_readings(hours, limit, user_id)

async def save_alert(alert_type: str, message: str, severity: str = "warning", 
                    user_id: str = "system", metadata: Dict = None) -> Optional[str]:
    return await firestore_service.save_alert(alert_type, message, severity, user_id, metadata)

async def get_alerts(limit: int = 50, user_id: str = "system", 
                    unresolved_only: bool = False) -> List[Dict]:
    return await firestore_service.get_alerts(limit, user_id, unresolved_only)

async def save_ml_analysis(analysis_data: Dict, user_id: str = "system") -> Optional[str]:
    return await firestore_service.save_ml_analysis(analysis_data, user_id)

def get_health_check() -> Dict:
    return firestore_service.health_check() 