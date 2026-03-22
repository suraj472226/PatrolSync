from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .database.connection import engine, Base

# Import all routers
from .routes import auth_routes, patrol_routes, incident_routes, user_routes, location_routes, checklist_routes, mobile_routes, file_routes, notification_routes, admin_routes

# Import all models (ensures tables are created)
from .models import user, site, patrol, incident, checklist, checklist_response, location_history, sos_alert, notification

# Create database tables automatically (for development)
# In production, use Alembic for migrations!
Base.metadata.create_all(bind=engine)

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="Patrol and Incident Reporting System",
    description="API for managing field officers, patrols, and incidents.",
    version="1.0.0"
)

# Configure CORS so your React Web Dashboard and React Native app can communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update this to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_routes.router)
app.include_router(patrol_routes.router)
app.include_router(incident_routes.router)
app.include_router(user_routes.router)
app.include_router(location_routes.router)
app.include_router(checklist_routes.router)
app.include_router(mobile_routes.router)
app.include_router(file_routes.router)
app.include_router(notification_routes.router)
app.include_router(admin_routes.router)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Patrol and Incident Reporting API"}