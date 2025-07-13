"""
AquaSentinel IoT Communication Module
Handles MQTT messaging and data transmission to Firebase
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Optional, Callable, Any
import paho.mqtt.client as mqtt
# import firebase_admin
# from firebase_admin import credentials, db
from sensors import SensorReading
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MQTTManager:
    """Manages MQTT communication for IoT devices"""
    
    def __init__(self, 
                 broker: str = None,
                 port: int = 1883,
                 username: str = None,
                 password: str = None):
        
        self.broker = broker or os.getenv('MQTT_BROKER', 'broker.hivemq.com')
        self.port = port or int(os.getenv('MQTT_PORT', '1883'))
        self.username = username or os.getenv('MQTT_USERNAME')
        self.password = password or os.getenv('MQTT_PASSWORD')
        
        self.client = mqtt.Client()
        self.is_connected = False
        self.message_callbacks = {}
        
        # Setup MQTT callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
        
        # Set credentials if provided
        if self.username and self.password:
            self.client.username_pw_set(self.username, self.password)
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback for MQTT connection"""
        if rc == 0:
            self.is_connected = True
            logger.info(f"Connected to MQTT broker: {self.broker}")
            
            # Subscribe to control topics
            self.subscribe("aquasentinel/control/+")
            self.subscribe("aquasentinel/emergency")
            
        else:
            logger.error(f"Failed to connect to MQTT broker. Code: {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback for MQTT disconnection"""
        self.is_connected = False
        logger.warning("Disconnected from MQTT broker")
    
    def _on_message(self, client, userdata, msg):
        """Callback for received MQTT messages"""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode('utf-8'))
            
            logger.info(f"Received message on {topic}: {payload}")
            
            # Route message to appropriate handler
            if topic in self.message_callbacks:
                self.message_callbacks[topic](payload)
            else:
                # Check for wildcard matches
                for callback_topic, callback in self.message_callbacks.items():
                    if '+' in callback_topic:
                        if self._topic_matches(topic, callback_topic):
                            callback(payload)
                            break
                            
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")
    
    def _topic_matches(self, topic: str, pattern: str) -> bool:
        """Check if topic matches pattern with wildcards"""
        topic_parts = topic.split('/')
        pattern_parts = pattern.split('/')
        
        if len(topic_parts) != len(pattern_parts):
            return False
        
        for topic_part, pattern_part in zip(topic_parts, pattern_parts):
            if pattern_part != '+' and pattern_part != topic_part:
                return False
        
        return True
    
    async def connect(self) -> bool:
        """Connect to MQTT broker"""
        try:
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
            
            # Wait for connection
            for _ in range(10):
                if self.is_connected:
                    return True
                await asyncio.sleep(0.5)
            
            logger.error("Timeout waiting for MQTT connection")
            return False
            
        except Exception as e:
            logger.error(f"Error connecting to MQTT broker: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.is_connected:
            self.client.loop_stop()
            self.client.disconnect()
    
    def subscribe(self, topic: str, callback: Callable = None):
        """Subscribe to MQTT topic"""
        if self.is_connected:
            self.client.subscribe(topic)
            if callback:
                self.message_callbacks[topic] = callback
            logger.info(f"Subscribed to topic: {topic}")
    
    def publish(self, topic: str, payload: Dict) -> bool:
        """Publish message to MQTT topic"""
        try:
            if self.is_connected:
                message = json.dumps(payload, default=str)
                result = self.client.publish(topic, message)
                return result.rc == mqtt.MQTT_ERR_SUCCESS
            else:
                logger.error("Not connected to MQTT broker")
                return False
                
        except Exception as e:
            logger.error(f"Error publishing MQTT message: {e}")
            return False

class FirebaseManager:
    """Manages Firebase integration for cloud data storage"""
    
    def __init__(self):
        self.app = None
        self.database = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Firebase disabled for testing
            logger.info("Firebase disabled for testing - using mock implementation")
            self.database = None
        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
            self.database = None
    
    def save_sensor_data(self, reading: SensorReading) -> bool:
        """Save sensor reading to Firebase (mock for testing)"""
        try:
            # Mock Firebase save for testing
            logger.debug(f"Mock Firebase save: {reading.to_dict()}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving to Firebase: {e}")
            return False
    
    def save_alert(self, alert_type: str, message: str, severity: str = "warning") -> bool:
        """Save alert to Firebase (mock for testing)"""
        try:
            # Mock Firebase save for testing
            logger.info(f"Mock alert save: {alert_type} - {message} ({severity})")
            return True
            
        except Exception as e:
            logger.error(f"Error saving alert to Firebase: {e}")
            return False
    
    def get_system_config(self) -> Dict:
        """Get system configuration from Firebase"""
        try:
            if not self.database:
                return {}
            
            ref = self.database.reference('system_config')
            config = ref.get() or {}
            return config
            
        except Exception as e:
            logger.error(f"Error getting config from Firebase: {e}")
            return {}

class IoTCommunicationHub:
    """Central hub for IoT communication"""
    
    def __init__(self):
        self.mqtt_manager = MQTTManager()
        self.firebase_manager = FirebaseManager()
        self.is_running = False
    
    async def start(self):
        """Start IoT communication hub"""
        self.is_running = True
        logger.info("Starting IoT Communication Hub")
        
        # Connect to MQTT
        if await self.mqtt_manager.connect():
            logger.info("MQTT connection established")
            self._setup_mqtt_handlers()
        else:
            logger.error("Failed to establish MQTT connection")
    
    def stop(self):
        """Stop IoT communication hub"""
        self.is_running = False
        self.mqtt_manager.disconnect()
        logger.info("IoT Communication Hub stopped")
    
    def _setup_mqtt_handlers(self):
        """Setup MQTT message handlers"""
        
        # Control message handler
        def handle_control_message(payload):
            control_type = payload.get('type')
            command = payload.get('command')
            
            logger.info(f"Control command received: {control_type} -> {command}")
            
            # Route to appropriate controller
            if control_type == 'valve':
                self._handle_valve_control(command)
            elif control_type == 'filter':
                self._handle_filter_control(command)
            elif control_type == 'drone':
                self._handle_drone_control(command, payload)
        
        # Emergency handler
        def handle_emergency(payload):
            logger.critical(f"Emergency message: {payload}")
            self.firebase_manager.save_alert(
                'emergency', 
                payload.get('message', 'Emergency activated'),
                'critical'
            )
        
        # Register handlers
        self.mqtt_manager.message_callbacks['aquasentinel/control/+'] = handle_control_message
        self.mqtt_manager.message_callbacks['aquasentinel/emergency'] = handle_emergency
    
    def _handle_valve_control(self, command: str):
        """Handle valve control commands"""
        valid_commands = ['0', 'C']  # Open, Close
        if command in valid_commands:
            self.publish_hardware_command('valve', command)
        else:
            logger.error(f"Invalid valve command: {command}")
    
    def _handle_filter_control(self, command: str):
        """Handle filter control commands"""
        valid_commands = ['r', 'f', 'b']  # Rotate, Forward, Backward
        if command in valid_commands:
            self.publish_hardware_command('filter', command)
        else:
            logger.error(f"Invalid filter command: {command}")
    
    def _handle_drone_control(self, command: str, payload: Dict):
        """Handle drone control commands"""
        if command == 'dispatch':
            lat = payload.get('latitude')
            lon = payload.get('longitude')
            if lat and lon:
                self.publish_drone_command(lat, lon)
            else:
                logger.error("Missing coordinates for drone dispatch")
    
    def publish_sensor_data(self, reading: SensorReading):
        """Publish sensor data to MQTT and Firebase"""
        data = reading.to_dict()
        
        # Publish to MQTT
        self.mqtt_manager.publish('aquasentinel/sensors/data', data)
        
        # Save to Firebase
        self.firebase_manager.save_sensor_data(reading)
        
        logger.info("Sensor data published")
    
    def publish_hardware_command(self, device: str, command: str):
        """Publish hardware control command"""
        payload = {
            'device': device,
            'command': command,
            'timestamp': datetime.now().isoformat()
        }
        
        topic = f"aquasentinel/hardware/{device}"
        self.mqtt_manager.publish(topic, payload)
        
        logger.info(f"Hardware command published: {device} -> {command}")
    
    def publish_drone_command(self, latitude: float, longitude: float):
        """Publish drone dispatch command"""
        payload = {
            'command': 'dispatch',
            'latitude': latitude,
            'longitude': longitude,
            'timestamp': datetime.now().isoformat()
        }
        
        self.mqtt_manager.publish('aquasentinel/drone/dispatch', payload)
        logger.info(f"Drone dispatch command published: {latitude}, {longitude}")
    
    def publish_alert(self, alert_type: str, message: str, severity: str = "warning"):
        """Publish alert message"""
        payload = {
            'type': alert_type,
            'message': message,
            'severity': severity,
            'timestamp': datetime.now().isoformat()
        }
        
        # Publish to MQTT
        self.mqtt_manager.publish('aquasentinel/alerts', payload)
        
        # Save to Firebase
        self.firebase_manager.save_alert(alert_type, message, severity)
        
        logger.info(f"Alert published: {alert_type} - {message}")

# Global IoT communication hub instance
iot_hub = IoTCommunicationHub()

async def main():
    """Main function for testing"""
    try:
        await iot_hub.start()
        
        # Keep running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        iot_hub.stop()
        logger.info("IoT Communication Hub stopped by user")

if __name__ == "__main__":
    asyncio.run(main()) 