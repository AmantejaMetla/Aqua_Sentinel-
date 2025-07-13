"""
AquaSentinel Sensor Monitoring Module
Handles reading data from TDS, pH, ORP, and Turbidity sensors
"""

import asyncio
import json
import sqlite3
import time
from datetime import datetime
from typing import Dict, Optional, List
from dataclasses import dataclass, asdict
import serial
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SensorReading:
    """Data class for sensor readings"""
    timestamp: datetime
    tds: float  # Total Dissolved Solids (ppm)
    ph: float   # pH level (0-14)
    orp: float  # Oxidation Reduction Potential (mV)
    turbidity: float  # Turbidity (NTU)
    temperature: float  # Temperature (°C)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data

class SensorManager:
    """Manages all water quality sensors"""
    
    def __init__(self, 
                 serial_port: str = "COM3", 
                 baudrate: int = 9600,
                 db_path: str = "./aquasentinel.db"):
        self.serial_port = serial_port
        self.baudrate = baudrate
        self.db_path = db_path
        self.serial_connection: Optional[serial.Serial] = None
        self.is_running = False
        self._init_database()
        
    def _init_database(self):
        """Initialize SQLite database for sensor data"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sensor_readings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    tds REAL NOT NULL,
                    ph REAL NOT NULL,
                    orp REAL NOT NULL,
                    turbidity REAL NOT NULL,
                    temperature REAL NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create index for faster timestamp queries
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_timestamp 
                ON sensor_readings(timestamp)
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Database initialized successfully")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")
            raise
    
    async def connect_serial(self) -> bool:
        """Establish serial connection to sensor hardware"""
        try:
            self.serial_connection = serial.Serial(
                port=self.serial_port,
                baudrate=self.baudrate,
                timeout=1
            )
            logger.info(f"Serial connection established on {self.serial_port}")
            return True
            
        except serial.SerialException as e:
            logger.error(f"Serial connection failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during serial connection: {e}")
            return False
    
    def disconnect_serial(self):
        """Close serial connection"""
        if self.serial_connection and self.serial_connection.is_open:
            self.serial_connection.close()
            logger.info("Serial connection closed")
    
    async def read_sensor_data(self) -> Optional[SensorReading]:
        """Read data from all sensors"""
        if not self.serial_connection or not self.serial_connection.is_open:
            # Simulate sensor data for development/testing
            return self._simulate_sensor_data()
        
        try:
            # Send command to request sensor data
            self.serial_connection.write(b"READ_SENSORS\n")
            
            # Read response
            response = self.serial_connection.readline().decode('utf-8').strip()
            
            if response:
                return self._parse_sensor_response(response)
            else:
                logger.warning("No response from sensors")
                return None
                
        except Exception as e:
            logger.error(f"Error reading sensor data: {e}")
            return None
    
    def _simulate_sensor_data(self) -> SensorReading:
        """Simulate sensor data for development purposes"""
        import random
        
        # Simulate realistic water quality parameters
        return SensorReading(
            timestamp=datetime.now(),
            tds=random.uniform(150, 300),  # Typical drinking water range
            ph=random.uniform(6.5, 8.5),   # Safe drinking water pH
            orp=random.uniform(200, 600),   # Oxidation potential
            turbidity=random.uniform(0.1, 1.0),  # Low turbidity for clean water
            temperature=random.uniform(20, 25)    # Room temperature
        )
    
    def _parse_sensor_response(self, response: str) -> Optional[SensorReading]:
        """Parse sensor response string into SensorReading object"""
        try:
            # Expected format: "TDS:250.5,pH:7.2,ORP:350.0,TURB:0.5,TEMP:22.5"
            data = {}
            pairs = response.split(',')
            
            for pair in pairs:
                key, value = pair.split(':')
                data[key.strip().lower()] = float(value.strip())
            
            return SensorReading(
                timestamp=datetime.now(),
                tds=data.get('tds', 0.0),
                ph=data.get('ph', 7.0),
                orp=data.get('orp', 0.0),
                turbidity=data.get('turb', 0.0),
                temperature=data.get('temp', 20.0)
            )
            
        except Exception as e:
            logger.error(f"Error parsing sensor response: {e}")
            return None
    
    def save_reading(self, reading: SensorReading) -> bool:
        """Save sensor reading to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO sensor_readings 
                (timestamp, tds, ph, orp, turbidity, temperature)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                reading.timestamp.isoformat(),
                reading.tds,
                reading.ph,
                reading.orp,
                reading.turbidity,
                reading.temperature
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Error saving reading to database: {e}")
            return False
    
    def get_recent_readings(self, hours: int = 24) -> List[SensorReading]:
        """Get recent sensor readings from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT timestamp, tds, ph, orp, turbidity, temperature
                FROM sensor_readings
                WHERE datetime(timestamp) >= datetime('now', '-{} hours')
                ORDER BY timestamp DESC
            '''.format(hours))
            
            readings = []
            for row in cursor.fetchall():
                readings.append(SensorReading(
                    timestamp=datetime.fromisoformat(row[0]),
                    tds=row[1],
                    ph=row[2],
                    orp=row[3],
                    turbidity=row[4],
                    temperature=row[5]
                ))
            
            conn.close()
            return readings
            
        except Exception as e:
            logger.error(f"Error retrieving readings: {e}")
            return []
    
    def validate_reading(self, reading: SensorReading) -> Dict[str, str]:
        """Validate sensor reading against safe water standards"""
        warnings = {}
        
        # pH validation (WHO standards: 6.5-8.5)
        if reading.ph < 6.5:
            warnings['ph'] = "pH too low - water is acidic"
        elif reading.ph > 8.5:
            warnings['ph'] = "pH too high - water is alkaline"
        
        # TDS validation (WHO recommendation: <600 ppm)
        if reading.tds > 600:
            warnings['tds'] = "TDS too high - excessive dissolved solids"
        elif reading.tds < 50:
            warnings['tds'] = "TDS too low - may lack essential minerals"
        
        # Turbidity validation (WHO standard: <1 NTU)
        if reading.turbidity > 1.0:
            warnings['turbidity'] = "Turbidity too high - water appears cloudy"
        
        # ORP validation (Good water: 200-600 mV)
        if reading.orp < 200:
            warnings['orp'] = "ORP too low - poor disinfection potential"
        elif reading.orp > 800:
            warnings['orp'] = "ORP too high - over-oxidized water"
        
        return warnings
    
    async def start_monitoring(self, interval: int = 30):
        """Start continuous sensor monitoring"""
        self.is_running = True
        logger.info(f"Starting sensor monitoring (interval: {interval}s)")
        
        # Try to connect to serial port
        await self.connect_serial()
        
        try:
            while self.is_running:
                reading = await self.read_sensor_data()
                
                if reading:
                    # Save to database
                    if self.save_reading(reading):
                        logger.info(f"Sensor reading saved: {reading.to_dict()}")
                        
                        # Check for warnings
                        warnings = self.validate_reading(reading)
                        if warnings:
                            logger.warning(f"Water quality warnings: {warnings}")
                    else:
                        logger.error("Failed to save sensor reading")
                
                await asyncio.sleep(interval)
                
        except Exception as e:
            logger.error(f"Error during monitoring: {e}")
        finally:
            self.disconnect_serial()
    
    def stop_monitoring(self):
        """Stop sensor monitoring"""
        self.is_running = False
        logger.info("Sensor monitoring stopped")

# Global sensor manager instance
sensor_manager = SensorManager()

async def main():
    """Main function for testing"""
    try:
        await sensor_manager.start_monitoring(interval=10)
    except KeyboardInterrupt:
        sensor_manager.stop_monitoring()
        logger.info("Monitoring stopped by user")

if __name__ == "__main__":
    asyncio.run(main()) 