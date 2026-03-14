from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database.connection import engine, Base

# Import all routers
from .routes import auth_routes, patrol_routes, incident_routes, user_routes, location_routes

from .models import user, site, patrol, incident

# Create database tables automatically (for development)
# In production, use Alembic for migrations!
Base.metadata.create_all(bind=engine)

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

@app.get("/")
def read_root():
    return {"message": "Welcome to the Patrol and Incident Reporting API"}