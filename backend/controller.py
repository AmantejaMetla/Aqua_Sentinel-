"""
AquaSentinel Hardware Controller Module
Manages valve operations, filter controls, and drone dispatch commands
"""

import asyncio
import json
import logging
import serial
import time
from datetime import datetime
from typing import Dict, Optional, List
from enum import Enum
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ValveState(Enum):
    """Valve state enumeration"""
    OPEN = "0"
    CLOSED = "C"
    UNKNOWN = "U"

class FilterPosition(Enum):
    """Filter position enumeration"""
    FORWARD = "f"
    BACKWARD = "b"
    ROTATE = "r"
    STOP = "s"

class ControllerStatus(Enum):
    """Controller status enumeration"""
    READY = "ready"
    BUSY = "busy"
    ERROR = "error"
    DISCONNECTED = "disconnected"

class HardwareController:
    """Main hardware controller for water filtration system"""
    
    def __init__(self, 
                 serial_port: str = None,
                 baudrate: int = 9600,
                 timeout: float = 2.0):
        
        self.serial_port = serial_port or os.getenv('SERIAL_PORT', 'COM3')
        self.baudrate = baudrate
        self.timeout = timeout
        self.serial_connection: Optional[serial.Serial] = None
        self.status = ControllerStatus.DISCONNECTED
        
        # System state
        self.valve_state = ValveState.UNKNOWN
        self.filter_position = FilterPosition.STOP
        self.last_command_time = None
        self.command_history = []
        
        # Safety settings
        self.max_valve_operations_per_hour = 100
        self.valve_operation_count = 0
        self.valve_count_reset_time = datetime.now()
        
    async def connect(self) -> bool:
        """Connect to hardware controller"""
        try:
            self.serial_connection = serial.Serial(
                port=self.serial_port,
                baudrate=self.baudrate,
                timeout=self.timeout
            )
            
            # Test connection
            await self._send_command("STATUS")
            response = await self._read_response()
            
            if response:
                self.status = ControllerStatus.READY
                logger.info(f"Hardware controller connected on {self.serial_port}")
                return True
            else:
                raise Exception("No response from hardware")
                
        except Exception as e:
            logger.error(f"Failed to connect to hardware controller: {e}")
            self.status = ControllerStatus.DISCONNECTED
            return False
    
    def disconnect(self):
        """Disconnect from hardware controller"""
        if self.serial_connection and self.serial_connection.is_open:
            self.serial_connection.close()
            self.status = ControllerStatus.DISCONNECTED
            logger.info("Hardware controller disconnected")
    
    async def _send_command(self, command: str) -> bool:
        """Send command to hardware controller"""
        try:
            if not self.serial_connection or not self.serial_connection.is_open:
                # If no hardware connected, simulate for development
                return await self._simulate_command(command)
            
            command_bytes = f"{command}\n".encode('utf-8')
            self.serial_connection.write(command_bytes)
            self.last_command_time = datetime.now()
            
            # Log command
            self.command_history.append({
                'command': command,
                'timestamp': self.last_command_time,
                'simulated': False
            })
            
            logger.info(f"Command sent: {command}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending command {command}: {e}")
            return False
    
    async def _read_response(self, timeout: float = None) -> Optional[str]:
        """Read response from hardware controller"""
        try:
            if not self.serial_connection or not self.serial_connection.is_open:
                # Simulate response for development
                await asyncio.sleep(0.1)
                return "OK"
            
            # Set timeout
            original_timeout = self.serial_connection.timeout
            if timeout:
                self.serial_connection.timeout = timeout
            
            response = self.serial_connection.readline().decode('utf-8').strip()
            
            # Restore original timeout
            self.serial_connection.timeout = original_timeout
            
            logger.debug(f"Response received: {response}")
            return response if response else None
            
        except Exception as e:
            logger.error(f"Error reading response: {e}")
            return None
    
    async def _simulate_command(self, command: str) -> bool:
        """Simulate command execution for development/testing"""
        await asyncio.sleep(0.1)  # Simulate processing delay
        
        # Log simulated command
        self.command_history.append({
            'command': command,
            'timestamp': datetime.now(),
            'simulated': True
        })
        
        # Update simulated state
        if command == ValveState.OPEN.value:
            self.valve_state = ValveState.OPEN
        elif command == ValveState.CLOSED.value:
            self.valve_state = ValveState.CLOSED
        elif command in [FilterPosition.FORWARD.value, FilterPosition.BACKWARD.value, 
                        FilterPosition.ROTATE.value]:
            self.filter_position = FilterPosition(command)
        
        logger.info(f"Simulated command: {command}")
        return True
    
    async def control_valve(self, action: str) -> Dict:
        """Control water valve (open/close)"""
        
        # Validate action
        if action not in [ValveState.OPEN.value, ValveState.CLOSED.value]:
            return {
                "success": False,
                "error": f"Invalid valve action: {action}. Use '0' (open) or 'C' (close)"
            }
        
        # Check safety limits
        if not self._check_valve_safety_limits():
            return {
                "success": False,
                "error": "Valve operation limit exceeded. Too many operations in the last hour."
            }
        
        try:
            self.status = ControllerStatus.BUSY
            
            # Send command
            success = await self._send_command(action)
            
            if success:
                # Wait for response
                response = await self._read_response(timeout=5.0)
                
                if response and "OK" in response.upper():
                    # Update state
                    self.valve_state = ValveState(action)
                    self._increment_valve_count()
                    
                    self.status = ControllerStatus.READY
                    
                    return {
                        "success": True,
                        "action": "opened" if action == "0" else "closed",
                        "valve_state": self.valve_state.value,
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    raise Exception("Hardware did not acknowledge command")
            else:
                raise Exception("Failed to send command")
                
        except Exception as e:
            self.status = ControllerStatus.ERROR
            logger.error(f"Valve control failed: {e}")
            
            return {
                "success": False,
                "error": str(e),
                "valve_state": self.valve_state.value
            }
    
    async def control_filter(self, action: str) -> Dict:
        """Control filter system (rotate, move forward/backward)"""
        
        # Validate action
        valid_actions = [FilterPosition.FORWARD.value, FilterPosition.BACKWARD.value, 
                        FilterPosition.ROTATE.value]
        
        if action not in valid_actions:
            return {
                "success": False,
                "error": f"Invalid filter action: {action}. Use 'f' (forward), 'b' (backward), 'r' (rotate)"
            }
        
        try:
            self.status = ControllerStatus.BUSY
            
            # Send command
            success = await self._send_command(action)
            
            if success:
                # Filter operations take longer
                response = await self._read_response(timeout=10.0)
                
                if response and "OK" in response.upper():
                    # Update state
                    self.filter_position = FilterPosition(action)
                    self.status = ControllerStatus.READY
                    
                    action_name = {
                        'f': 'moved forward',
                        'b': 'moved backward', 
                        'r': 'rotated'
                    }[action]
                    
                    return {
                        "success": True,
                        "action": action_name,
                        "filter_position": self.filter_position.value,
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    raise Exception("Hardware did not acknowledge command")
            else:
                raise Exception("Failed to send command")
                
        except Exception as e:
            self.status = ControllerStatus.ERROR
            logger.error(f"Filter control failed: {e}")
            
            return {
                "success": False,
                "error": str(e),
                "filter_position": self.filter_position.value
            }
    
    async def emergency_stop(self) -> Dict:
        """Emergency stop all operations"""
        try:
            logger.warning("Emergency stop activated")
            
            # Send emergency stop command
            success = await self._send_command("STOP")
            
            if success:
                # Close valve for safety
                await self._send_command(ValveState.CLOSED.value)
                
                self.valve_state = ValveState.CLOSED
                self.filter_position = FilterPosition.STOP
                self.status = ControllerStatus.READY
                
                return {
                    "success": True,
                    "message": "Emergency stop executed",
                    "valve_state": self.valve_state.value,
                    "filter_position": self.filter_position.value,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                raise Exception("Failed to send emergency stop command")
                
        except Exception as e:
            logger.error(f"Emergency stop failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_status(self) -> Dict:
        """Get current system status"""
        return {
            "controller_status": self.status.value,
            "valve_state": self.valve_state.value,
            "filter_position": self.filter_position.value,
            "last_command_time": self.last_command_time.isoformat() if self.last_command_time else None,
            "valve_operations_today": self.valve_operation_count,
            "connected": self.serial_connection and self.serial_connection.is_open if self.serial_connection else False,
            "recent_commands": self.command_history[-5:] if self.command_history else []
        }
    
    def _check_valve_safety_limits(self) -> bool:
        """Check if valve operation is within safety limits"""
        now = datetime.now()
        
        # Reset counter if an hour has passed
        if (now - self.valve_count_reset_time).total_seconds() > 3600:
            self.valve_operation_count = 0
            self.valve_count_reset_time = now
        
        return self.valve_operation_count < self.max_valve_operations_per_hour
    
    def _increment_valve_count(self):
        """Increment valve operation counter"""
        self.valve_operation_count += 1

class DroneController:
    """Controller for drone dispatch and coordination"""
    
    def __init__(self):
        self.active_missions = {}
        self.drone_status = "available"  # available, dispatched, maintenance
        self.mission_counter = 0
    
    async def dispatch_drone(self, latitude: float, longitude: float, 
                           mission_type: str = "delivery") -> Dict:
        """Dispatch drone to specified coordinates"""
        
        if self.drone_status != "available":
            return {
                "success": False,
                "error": f"Drone not available. Current status: {self.drone_status}"
            }
        
        # Validate coordinates
        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            return {
                "success": False,
                "error": "Invalid coordinates"
            }
        
        try:
            self.mission_counter += 1
            mission_id = f"mission_{self.mission_counter}_{int(time.time())}"
            
            # Create mission
            mission = {
                "id": mission_id,
                "type": mission_type,
                "latitude": latitude,
                "longitude": longitude,
                "status": "dispatched",
                "dispatch_time": datetime.now(),
                "estimated_arrival": datetime.now().replace(minute=datetime.now().minute + 15)  # 15 min estimate
            }
            
            self.active_missions[mission_id] = mission
            self.drone_status = "dispatched"
            
            # In a real implementation, this would interface with drone API
            logger.info(f"Drone dispatched to {latitude}, {longitude} for {mission_type}")
            
            # Simulate mission completion after some time
            asyncio.create_task(self._simulate_mission_completion(mission_id))
            
            return {
                "success": True,
                "mission_id": mission_id,
                "message": f"Drone dispatched for {mission_type}",
                "coordinates": {"latitude": latitude, "longitude": longitude},
                "estimated_arrival": mission["estimated_arrival"].isoformat()
            }
            
        except Exception as e:
            logger.error(f"Drone dispatch failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _simulate_mission_completion(self, mission_id: str):
        """Simulate mission completion (for development)"""
        # Wait for simulated mission duration (5-15 minutes)
        await asyncio.sleep(300)  # 5 minutes for simulation
        
        if mission_id in self.active_missions:
            self.active_missions[mission_id]["status"] = "completed"
            self.active_missions[mission_id]["completion_time"] = datetime.now()
            self.drone_status = "available"
            
            logger.info(f"Mission {mission_id} completed")
    
    def get_mission_status(self, mission_id: str) -> Dict:
        """Get status of specific mission"""
        if mission_id not in self.active_missions:
            return {
                "success": False,
                "error": "Mission not found"
            }
        
        mission = self.active_missions[mission_id]
        return {
            "success": True,
            "mission": {
                "id": mission["id"],
                "type": mission["type"],
                "status": mission["status"],
                "coordinates": {
                    "latitude": mission["latitude"],
                    "longitude": mission["longitude"]
                },
                "dispatch_time": mission["dispatch_time"].isoformat(),
                "estimated_arrival": mission["estimated_arrival"].isoformat(),
                "completion_time": mission.get("completion_time", {}).isoformat() if mission.get("completion_time") else None
            }
        }
    
    def get_drone_status(self) -> Dict:
        """Get current drone status"""
        return {
            "status": self.drone_status,
            "active_missions": len([m for m in self.active_missions.values() if m["status"] == "dispatched"]),
            "total_missions": self.mission_counter,
            "recent_missions": list(self.active_missions.values())[-5:]  # Last 5 missions
        }

# Global controller instances
hardware_controller = HardwareController()
drone_controller = DroneController()

async def initialize_controllers() -> Dict:
    """Initialize all controllers"""
    results = {}
    
    # Initialize hardware controller
    hardware_connected = await hardware_controller.connect()
    results["hardware"] = {
        "connected": hardware_connected,
        "status": hardware_controller.status.value
    }
    
    # Drone controller doesn't need initialization
    results["drone"] = {
        "status": drone_controller.drone_status,
        "ready": True
    }
    
    return results

async def shutdown_controllers():
    """Shutdown all controllers safely"""
    logger.info("Shutting down controllers...")
    
    # Emergency stop if needed
    if hardware_controller.status == ControllerStatus.BUSY:
        await hardware_controller.emergency_stop()
    
    # Disconnect hardware
    hardware_controller.disconnect()
    
    logger.info("Controllers shutdown complete")

# Command processing functions for IoT integration
async def process_control_command(command_type: str, command: str, **kwargs) -> Dict:
    """Process control command from IoT system"""
    
    if command_type == "valve":
        return await hardware_controller.control_valve(command)
    
    elif command_type == "filter":
        return await hardware_controller.control_filter(command)
    
    elif command_type == "drone":
        if command == "dispatch":
            lat = kwargs.get("latitude")
            lon = kwargs.get("longitude")
            if lat and lon:
                return await drone_controller.dispatch_drone(lat, lon)
            else:
                return {"success": False, "error": "Missing coordinates"}
    
    elif command_type == "emergency":
        return await hardware_controller.emergency_stop()
    
    else:
        return {
            "success": False,
            "error": f"Unknown command type: {command_type}"
        }

async def main():
    """Main function for testing"""
    logger.info("Testing hardware controllers...")
    
    # Initialize controllers
    init_results = await initialize_controllers()
    print(f"Initialization results: {json.dumps(init_results, indent=2)}")
    
    # Test valve control
    valve_result = await hardware_controller.control_valve("0")  # Open
    print(f"Valve open result: {json.dumps(valve_result, indent=2, default=str)}")
    
    await asyncio.sleep(2)
    
    valve_result = await hardware_controller.control_valve("C")  # Close
    print(f"Valve close result: {json.dumps(valve_result, indent=2, default=str)}")
    
    # Test filter control
    filter_result = await hardware_controller.control_filter("r")  # Rotate
    print(f"Filter rotate result: {json.dumps(filter_result, indent=2, default=str)}")
    
    # Test drone dispatch
    drone_result = await drone_controller.dispatch_drone(40.7128, -74.0060, "emergency_supply")
    print(f"Drone dispatch result: {json.dumps(drone_result, indent=2, default=str)}")
    
    # Get status
    status = hardware_controller.get_status()
    print(f"Hardware status: {json.dumps(status, indent=2, default=str)}")
    
    # Shutdown
    await shutdown_controllers()

if __name__ == "__main__":
    asyncio.run(main()) 