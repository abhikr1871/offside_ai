import os
import logging
from dotenv import load_dotenv

# Load local environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.api.live_matches import router as live_matches_router
from app.api.logistics import router as logistics_router
from app.api.schedule import router as schedule_router
from app.api.competitions import router as competitions_router, teams_router
from app.api.auth import router as auth_router
from app.api.agent import router as agent_router
from app.api.tickets import router as tickets_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("offside_ai")

# Initialize FastAPI App
app = FastAPI(
    title="Offside AI Backend API",
    description="Python FastAPI backend serving agents, models, and data services for Offside AI.",
    version="1.0.0"
)

# Set up CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    # Add production frontend domain here when deployed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(live_matches_router)
app.include_router(logistics_router)
app.include_router(schedule_router)
app.include_router(competitions_router)
app.include_router(teams_router)
app.include_router(auth_router)
app.include_router(agent_router)
app.include_router(tickets_router)

# Root Endpoint
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Offside AI Backend",
        "version": "1.0.0"
    }

# Health Check Endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "disconnected" # Will hook up to MongoDB Atlas
    }

# Config Endpoint
@app.get("/api/v1/config")
def get_config():
    from app.db.vector_search import APP_MODE
    return {
        "app_mode": APP_MODE,
        "supported_leagues": [
            {"value": "PL", "label": "Premier League"},
            {"value": "PD", "label": "LaLiga"},
            {"value": "SA", "label": "Serie A"},
            {"value": "BL1", "label": "Bundesliga"},
            {"value": "FL1", "label": "Ligue 1"},
            {"value": "CL", "label": "Champions League"},
            {"value": "ELC", "label": "Championship"},
            {"value": "DED", "label": "Eredivisie"},
            {"value": "PPL", "label": "Primeira Liga"},
            {"value": "CLI", "label": "Copa Libertadores"},
        ] if APP_MODE == "club" else [
            {"value": "WC", "label": "FIFA World Cup"}
        ]
    }
# Reload trigger comment - force reload 1


