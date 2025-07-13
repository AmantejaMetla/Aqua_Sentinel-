// Firestore Database Service for AquaSentinel
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  writeBatch,
  startAfter,
  endBefore
} from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// Collection names
const COLLECTIONS = {
  SENSOR_READINGS: 'sensor_readings',
  ALERTS: 'alerts',
  USER_SETTINGS: 'user_settings',
  SYSTEM_CONFIG: 'system_config',
  ML_ANALYSIS: 'ml_analysis',
  CONTROL_ACTIONS: 'control_actions',
  MAINTENANCE_LOGS: 'maintenance_logs'
};

// Database utility functions
export class DatabaseService {
  constructor() {
    this.db = db;
    this.auth = auth;
  }

  // Get current user ID
  getCurrentUserId() {
    return this.auth.currentUser?.uid || 'anonymous';
  }

  // SENSOR READINGS
  async saveSensorReading(sensorData) {
    try {
      const reading = {
        ...sensorData,
        userId: this.getCurrentUserId(),
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(this.db, COLLECTIONS.SENSOR_READINGS), reading);
      console.log('Sensor reading saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving sensor reading:', error);
      throw error;
    }
  }

  async getSensorReadings(hours = 24, limitCount = 100) {
    try {
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
      const q = query(
        collection(this.db, COLLECTIONS.SENSOR_READINGS),
        where('userId', '==', this.getCurrentUserId()),
        where('createdAt', '>=', hoursAgo.toISOString()),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const readings = [];
      
      snapshot.forEach((doc) => {
        readings.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return readings;
    } catch (error) {
      console.error('Error getting sensor readings:', error);
      return [];
    }
  }

  // Real-time sensor data subscription
  subscribeToSensorData(callback, hours = 1) {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    const q = query(
      collection(this.db, COLLECTIONS.SENSOR_READINGS),
      where('userId', '==', this.getCurrentUserId()),
      where('createdAt', '>=', hoursAgo.toISOString()),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const readings = [];
      snapshot.forEach((doc) => {
        readings.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(readings);
    });
  }

  // ALERTS
  async saveAlert(alertData) {
    try {
      const alert = {
        ...alertData,
        userId: this.getCurrentUserId(),
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
        isRead: false,
        isResolved: false
      };

      const docRef = await addDoc(collection(this.db, COLLECTIONS.ALERTS), alert);
      console.log('Alert saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving alert:', error);
      throw error;
    }
  }

  async getAlerts(limitCount = 50) {
    try {
      const q = query(
        collection(this.db, COLLECTIONS.ALERTS),
        where('userId', '==', this.getCurrentUserId()),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const alerts = [];
      
      snapshot.forEach((doc) => {
        alerts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return alerts;
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  async markAlertAsRead(alertId) {
    try {
      await updateDoc(doc(this.db, COLLECTIONS.ALERTS, alertId), {
        isRead: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  }

  async resolveAlert(alertId) {
    try {
      await updateDoc(doc(this.db, COLLECTIONS.ALERTS, alertId), {
        isResolved: true,
        resolvedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Real-time alerts subscription
  subscribeToAlerts(callback) {
    const q = query(
      collection(this.db, COLLECTIONS.ALERTS),
      where('userId', '==', this.getCurrentUserId()),
      where('isResolved', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, (snapshot) => {
      const alerts = [];
      snapshot.forEach((doc) => {
        alerts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(alerts);
    });
  }

  // USER SETTINGS
  async saveUserSettings(settings) {
    try {
      const userId = this.getCurrentUserId();
      const settingsData = {
        ...settings,
        userId,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(this.db, COLLECTIONS.USER_SETTINGS, userId), settingsData);
      console.log('User settings saved');
    } catch (error) {
      // If document doesn't exist, create it
      if (error.code === 'not-found') {
        await addDoc(collection(this.db, COLLECTIONS.USER_SETTINGS), {
          ...settings,
          userId: this.getCurrentUserId(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        console.error('Error saving user settings:', error);
        throw error;
      }
    }
  }

  async getUserSettings() {
    try {
      const userId = this.getCurrentUserId();
      const docRef = doc(this.db, COLLECTIONS.USER_SETTINGS, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Return default settings
        return {
          theme: 'light',
          refreshInterval: 30,
          compactMode: false,
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        };
      }
    } catch (error) {
      console.error('Error getting user settings:', error);
      return {};
    }
  }

  // CONTROL ACTIONS
  async saveControlAction(actionData) {
    try {
      const action = {
        ...actionData,
        userId: this.getCurrentUserId(),
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(this.db, COLLECTIONS.CONTROL_ACTIONS), action);
      console.log('Control action saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving control action:', error);
      throw error;
    }
  }

  async getControlActions(limitCount = 50) {
    try {
      const q = query(
        collection(this.db, COLLECTIONS.CONTROL_ACTIONS),
        where('userId', '==', this.getCurrentUserId()),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const actions = [];
      
      snapshot.forEach((doc) => {
        actions.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return actions;
    } catch (error) {
      console.error('Error getting control actions:', error);
      return [];
    }
  }

  // ML ANALYSIS
  async saveMlAnalysis(analysisData) {
    try {
      const analysis = {
        ...analysisData,
        userId: this.getCurrentUserId(),
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(this.db, COLLECTIONS.ML_ANALYSIS), analysis);
      console.log('ML analysis saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving ML analysis:', error);
      throw error;
    }
  }

  async getMlAnalysis(limitCount = 10) {
    try {
      const q = query(
        collection(this.db, COLLECTIONS.ML_ANALYSIS),
        where('userId', '==', this.getCurrentUserId()),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const analyses = [];
      
      snapshot.forEach((doc) => {
        analyses.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return analyses;
    } catch (error) {
      console.error('Error getting ML analysis:', error);
      return [];
    }
  }

  // MAINTENANCE LOGS
  async saveMaintenanceLog(logData) {
    try {
      const log = {
        ...logData,
        userId: this.getCurrentUserId(),
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(this.db, COLLECTIONS.MAINTENANCE_LOGS), log);
      console.log('Maintenance log saved with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error saving maintenance log:', error);
      throw error;
    }
  }

  async getMaintenanceLogs(limitCount = 20) {
    try {
      const q = query(
        collection(this.db, COLLECTIONS.MAINTENANCE_LOGS),
        where('userId', '==', this.getCurrentUserId()),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const logs = [];
      
      snapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return logs;
    } catch (error) {
      console.error('Error getting maintenance logs:', error);
      return [];
    }
  }

  // SYSTEM CONFIGURATION
  async getSystemConfig() {
    try {
      const q = query(collection(this.db, COLLECTIONS.SYSTEM_CONFIG));
      const snapshot = await getDocs(q);
      const config = {};
      
      snapshot.forEach((doc) => {
        config[doc.id] = doc.data();
      });

      return config;
    } catch (error) {
      console.error('Error getting system config:', error);
      return {};
    }
  }

  // BATCH OPERATIONS
  async batchWriteSensorData(readings) {
    try {
      const batch = writeBatch(this.db);
      const userId = this.getCurrentUserId();

      readings.forEach((reading) => {
        const docRef = doc(collection(this.db, COLLECTIONS.SENSOR_READINGS));
        batch.set(docRef, {
          ...reading,
          userId,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString()
        });
      });

      await batch.commit();
      console.log('Batch sensor data saved');
    } catch (error) {
      console.error('Error batch saving sensor data:', error);
      throw error;
    }
  }

  // CLEANUP FUNCTIONS
  async cleanupOldData(days = 30) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const batch = writeBatch(this.db);

      // Clean up old sensor readings
      const q = query(
        collection(this.db, COLLECTIONS.SENSOR_READINGS),
        where('createdAt', '<', cutoffDate.toISOString()),
        limit(100)
      );

      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('Old data cleanup completed');
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export individual functions for convenience
export const {
  saveSensorReading,
  getSensorReadings,
  subscribeToSensorData,
  saveAlert,
  getAlerts,
  markAlertAsRead,
  resolveAlert,
  subscribeToAlerts,
  saveUserSettings,
  getUserSettings,
  saveControlAction,
  getControlActions,
  saveMlAnalysis,
  getMlAnalysis,
  saveMaintenanceLog,
  getMaintenanceLogs,
  getSystemConfig,
  batchWriteSensorData,
  cleanupOldData
} = databaseService; 