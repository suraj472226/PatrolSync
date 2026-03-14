from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..schemas.incident_schema import IncidentCreate, SOSAlert, IncidentResponse
from ..models.user import User
from ..models.incident import Incident
from ..core.dependencies import get_current_user
from typing import List


router = APIRouter(prefix="/incident", tags=["Incidents & Emergencies"])

@router.post("/report", response_model=IncidentResponse)
def report_incident(
    incident_data: IncidentCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Log a new incident with auto location and time capture[cite: 68].
    """
    new_incident = Incident(
        user_id=current_user.id,
        site_id=incident_data.site_id,
        category=incident_data.category,
        remarks=incident_data.remarks,
        photo_url=incident_data.photo_url,
        latitude=incident_data.latitude,
        longitude=incident_data.longitude
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)
    return new_incident

@router.post("/sos")
def trigger_sos(
    sos_data: SOSAlert, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    One-tap SOS button to instantly notify the command center[cite: 31, 70].
    """
    # 1. Log the SOS as a high-priority incident in the database
    sos_incident = Incident(
        user_id=current_user.id,
        category="EMERGENCY_SOS",
        remarks="SOS Triggered by Officer",
        latitude=sos_data.latitude,
        longitude=sos_data.longitude
    )
    db.add(sos_incident)
    db.commit()
    
    # 2. TODO: Integrate SMS/Dashboard Alert logic here [cite: 72, 73]
    # For example: alert_service.send_sms_to_admin(current_user, sos_data)
    
    return {"message": "SOS Alert sent successfully to the control room.", "location": sos_data}

@router.get("/", response_model=List[IncidentResponse])
def get_all_incidents(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Fetch all incidents, ordered by most recent first.
    Admin/Supervisors see all; you could filter this by role later.
    """
    # Fetch incidents and order them by newest first
    incidents = db.query(Incident).order_by(Incident.reported_at.desc()).all()
    return incidents


@router.patch("/{incident_id}/resolve")
def resolve_incident(
    incident_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Mark an incident/SOS as resolved so it clears from the live dashboard."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    incident.is_resolved = True
    db.commit()
    
    return {"message": "Incident resolved successfully", "incident_id": incident.id}