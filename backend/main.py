"""
AquaSentinel Main FastAPI Backend
Central API server that coordinates all system components
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from contextlib import asynccontextmanager

# FastAPI imports
from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

# Local module imports
from sensors import sensor_manager, SensorReading
from iot_comm import iot_hub
from ml_model_simple import analyze_water_quality, filter_predictor
from controller import hardware_controller, drone_controller, process_control_command, initialize_controllers
from weather_integration import weather_controller, get_weather_status

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic models for API requests/responses
class SensorReadingResponse(BaseModel):
    timestamp: str
    tds: float
    ph: float
    orp: float
    turbidity: float
    temperature: float

class ControlRequest(BaseModel):
    command_type: str = Field(..., description="Type of control command (valve, filter, drone, emergency)")
    command: str = Field(..., description="Specific command to execute")
    latitude: Optional[float] = Field(None, description="Latitude for drone dispatch")
    longitude: Optional[float] = Field(None, description="Longitude for drone dispatch")

class SystemStatus(BaseModel):
    sensors: Dict
    controller: Dict
    iot: Dict
    ml: Dict
    weather: Dict
    timestamp: str

class WebSocketManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket client connected")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected")
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, default=str))
            except Exception as e:
                logger.warning(f"Failed to send message to WebSocket client: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

# Global WebSocket manager
websocket_manager = WebSocketManager()

# Background task state
monitoring_active = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("Starting AquaSentinel Backend...")
    
    try:
        # Initialize all subsystems
        await initialize_system()
        logger.info("All subsystems initialized successfully")
        
        # Start background monitoring
        asyncio.create_task(background_monitoring())
        
    except Exception as e:
        logger.error(f"Failed to initialize system: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AquaSentinel Backend...")
    global monitoring_active
    monitoring_active = False
    
    # Stop sensor monitoring
    sensor_manager.stop_monitoring()
    
    # Stop IoT hub
    iot_hub.stop()

# Create FastAPI app
app = FastAPI(
    title="AquaSentinel API",
    description="Intelligent Water Purification System API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routes

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "AquaSentinel API",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """System health check endpoint"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "sensors": sensor_manager.is_running,
                "iot": iot_hub.is_running,
                "controller": hardware_controller.status.value,
                "ml": filter_predictor.is_trained
            }
        }
        return health_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/status", response_model=SystemStatus)
async def get_system_status():
    """Get comprehensive system status"""
    try:
        # Get status from all components
        sensor_status = {
            "running": sensor_manager.is_running,
            "recent_readings_count": len(sensor_manager.get_recent_readings(hours=1))
        }
        
        controller_status = hardware_controller.get_status()
        
        iot_status = {
            "mqtt_connected": iot_hub.mqtt_manager.is_connected if iot_hub.mqtt_manager else False,
            "firebase_ready": iot_hub.firebase_manager.database is not None if iot_hub.firebase_manager else False
        }
        
        ml_status = {
            "model_trained": filter_predictor.is_trained,
            "model_path": str(filter_predictor.model_path)
        }
        
        weather_status = await get_weather_status()
        
        return SystemStatus(
            sensors=sensor_status,
            controller=controller_status,
            iot=iot_status,
            ml=ml_status,
            weather=weather_status,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system status: {str(e)}")

@app.get("/sensors/current")
async def get_current_reading():
    """Get the most recent sensor reading"""
    try:
        reading = await sensor_manager.read_sensor_data()
        if reading:
            return SensorReadingResponse(
                timestamp=reading.timestamp.isoformat(),
                tds=reading.tds,
                ph=reading.ph,
                orp=reading.orp,
                turbidity=reading.turbidity,
                temperature=reading.temperature
            )
        else:
            raise HTTPException(status_code=404, detail="No current sensor data available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sensor reading: {str(e)}")

@app.get("/sensors/history")
async def get_sensor_history(hours: int = 24):
    """Get historical sensor readings"""
    try:
        if hours < 1 or hours > 168:  # Limit to 1 week
            raise HTTPException(status_code=400, detail="Hours must be between 1 and 168")
        
        readings = sensor_manager.get_recent_readings(hours=hours)
        
        return {
            "readings": [
                SensorReadingResponse(
                    timestamp=r.timestamp.isoformat(),
                    tds=r.tds,
                    ph=r.ph,
                    orp=r.orp,
                    turbidity=r.turbidity,
                    temperature=r.temperature
                ) for r in readings
            ],
            "count": len(readings),
            "hours": hours
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sensor history: {str(e)}")

@app.post("/control")
async def execute_control_command(request: ControlRequest):
    """Execute hardware control command"""
    try:
        result = await process_control_command(
            command_type=request.command_type,
            command=request.command,
            latitude=request.latitude,
            longitude=request.longitude
        )
        
        # Broadcast control event to WebSocket clients
        await websocket_manager.broadcast({
            "type": "control_executed",
            "command_type": request.command_type,
            "command": request.command,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Control command failed: {str(e)}")

@app.get("/ml/analysis")
async def get_ml_analysis(hours: int = 24, filter_usage_hours: float = 0, days_since_replacement: int = 0):
    """Get ML analysis of water quality and filter status"""
    try:
        readings = sensor_manager.get_recent_readings(hours=hours)
        
        if not readings:
            raise HTTPException(status_code=404, detail="No sensor data available for analysis")
        
        analysis = await analyze_water_quality(
            readings=readings,
            filter_usage_hours=filter_usage_hours,
            days_since_replacement=days_since_replacement
        )
        
        return analysis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML analysis failed: {str(e)}")

@app.get("/weather")
async def get_weather_recommendations():
    """Get weather-based treatment recommendations"""
    try:
        return await get_weather_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Weather analysis failed: {str(e)}")

@app.get("/drone/status")
async def get_drone_status():
    """Get drone system status"""
    try:
        return drone_controller.get_drone_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get drone status: {str(e)}")

@app.get("/drone/mission/{mission_id}")
async def get_mission_status(mission_id: str):
    """Get specific mission status"""
    try:
        return drone_controller.get_mission_status(mission_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get mission status: {str(e)}")

@app.post("/emergency/stop")
async def emergency_stop():
    """Emergency stop all operations"""
    try:
        result = await hardware_controller.emergency_stop()
        
        # Broadcast emergency stop to all clients
        await websocket_manager.broadcast({
            "type": "emergency_stop",
            "result": result,
            "timestamp": datetime.now().isoformat()
        })
        
        # Publish emergency alert through IoT hub
        iot_hub.publish_alert("emergency_stop", "Emergency stop activated via API", "critical")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emergency stop failed: {str(e)}")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket_manager.connect(websocket)
    
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "subscribe":
                # Client wants to subscribe to updates
                await websocket.send_text(json.dumps({
                    "type": "subscription_confirmed",
                    "timestamp": datetime.now().isoformat()
                }))
            
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        websocket_manager.disconnect(websocket)

# Background Tasks

async def initialize_system():
    """Initialize all system components"""
    
    # Initialize controllers
    controller_results = await initialize_controllers()
    logger.info(f"Controllers initialized: {controller_results}")
    
    # Start IoT communication hub
    await iot_hub.start()
    
    # Train ML model if not already trained
    if not filter_predictor.is_trained:
        logger.info("Training ML model...")
        filter_predictor.train_model()

async def background_monitoring():
    """Background task for continuous monitoring and data processing"""
    global monitoring_active
    monitoring_active = True
    
    logger.info("Starting background monitoring task")
    
    while monitoring_active:
        try:
            # Get current sensor reading
            reading = await sensor_manager.read_sensor_data()
            
            if reading:
                # Save to database
                sensor_manager.save_reading(reading)
                
                # Publish to IoT hub
                iot_hub.publish_sensor_data(reading)
                
                # Validate reading and check for alerts
                warnings = sensor_manager.validate_reading(reading)
                if warnings:
                    for param, message in warnings.items():
                        iot_hub.publish_alert(f"sensor_warning_{param}", message, "warning")
                
                # Broadcast to WebSocket clients
                await websocket_manager.broadcast({
                    "type": "sensor_update",
                    "data": reading.to_dict(),
                    "warnings": warnings
                })
                
                # Periodic ML analysis (every 10 readings)
                if len(sensor_manager.get_recent_readings(hours=1)) % 10 == 0:
                    try:
                        recent_readings = sensor_manager.get_recent_readings(hours=24)
                        analysis = await analyze_water_quality(recent_readings)
                        
                        # Check for critical alerts
                        alerts = analysis.get("alerts", [])
                        for alert in alerts:
                            if alert.get("severity") == "high":
                                iot_hub.publish_alert(alert["type"], alert["message"], "high")
                        
                        # Broadcast analysis to clients
                        await websocket_manager.broadcast({
                            "type": "ml_analysis",
                            "data": analysis
                        })
                        
                    except Exception as e:
                        logger.error(f"ML analysis error in background task: {e}")
            
            # Wait before next reading
            await asyncio.sleep(30)  # 30 second intervals
            
        except Exception as e:
            logger.error(f"Background monitoring error: {e}")
            await asyncio.sleep(60)  # Wait longer on error

# Custom error handlers

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Not found", "detail": "The requested resource was not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": "An unexpected error occurred"}
    )

# Development server configuration
if __name__ == "__main__":
    logger.info("Starting AquaSentinel API server...")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 