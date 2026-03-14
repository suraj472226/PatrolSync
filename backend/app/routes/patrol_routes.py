from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from ..database.connection import get_db
from ..schemas.patrol_schema import ShiftStart, ShiftEnd, ShiftResponse, PatrolLogCreate, PatrolLogResponse
from ..models.user import User
from ..models.patrol import Shift, PatrolLog
from ..core.dependencies import get_current_user
from sqlalchemy import func
from ..models.incident import Incident

router = APIRouter(prefix="/patrol", tags=["Patrol & Shift Operations"])


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch aggregate statistics for the command center dashboard."""
    
    # 1. Count Active Officers (Officers with an active shift)
    active_officers = db.query(Shift).filter(Shift.end_time == None).count()
    
    # 2. Count Sites Patrolled Today (Unique sites visited today)
    today = datetime.utcnow().date()
    sites_patrolled = db.query(PatrolLog.site_id).filter(
        func.date(PatrolLog.scan_time) == today
    ).distinct().count()
    
    # 3. Count Critical Incidents (Incidents reported today)
    critical_incidents = db.query(Incident).filter(
        func.date(Incident.reported_at) == today
    ).count()
    
    # 4. Missed Checkpoints (Placeholder logic - requires a schedule to compare against)
    missed_checkpoints = 0 
    
    return {
        "activeOfficers": active_officers,
        "sitesPatrolled": sites_patrolled,
        "criticalIncidents": critical_incidents,
        "missedCheckpoints": missed_checkpoints
    }
    
    
@router.get("/live-locations")
def get_live_locations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Fetch the latest GPS coordinates of all officers currently on duty."""
    
    # Get all active shifts (end_time is None)
    active_shifts = db.query(Shift).filter(Shift.end_time == None).all()
    
    locations = []
    for shift in active_shifts:
        # Get the user details for the popup
        user = db.query(User).filter(User.id == shift.user_id).first()
        
        # Note: In a production app, you would have a dedicated 'LocationHistory' table 
        # updated every 5 minutes. For now, we use their shift start location.
        if user and shift.start_latitude and shift.start_longitude:
            locations.append({
                "officer_name": user.employee_id,
                "role": user.role,
                "latitude": shift.start_latitude,
                "longitude": shift.start_longitude,
                "shift_start": shift.start_time
            })
            
    return locations
    
@router.post("/shift/start", response_model=ShiftResponse)
def start_shift(
    shift_data: ShiftStart, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Start a shift with mandatory GPS capture[cite: 49, 50]."""
    # 1. Check if the officer already has an active shift
    active_shift = db.query(Shift).filter(
        Shift.user_id == current_user.id, 
        Shift.end_time == None
    ).first()
    
    if active_shift:
        raise HTTPException(status_code=400, detail="You already have an active shift.")

    # 2. Create the new shift
    new_shift = Shift(
        user_id=current_user.id,
        start_latitude=shift_data.start_latitude,
        start_longitude=shift_data.start_longitude
    )
    db.add(new_shift)
    db.commit()
    db.refresh(new_shift)
    return new_shift

@router.post("/shift/end", response_model=ShiftResponse)
def end_shift(
    shift_data: ShiftEnd, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """End the current active shift with GPS capture[cite: 49, 50]."""
    active_shift = db.query(Shift).filter(
        Shift.user_id == current_user.id, 
        Shift.end_time == None
    ).first()
    
    if not active_shift:
        raise HTTPException(status_code=400, detail="No active shift found to end.")

    active_shift.end_time = datetime.utcnow()
    active_shift.end_latitude = shift_data.end_latitude
    active_shift.end_longitude = shift_data.end_longitude
    db.commit()
    db.refresh(active_shift)
    return active_shift

@router.post("/log", response_model=PatrolLogResponse)
def log_patrol_checkpoint(
    log_data: PatrolLogCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Log a checkpoint verification (QR/GPS/NFC) and attach photo audits[cite: 58, 60]."""
    # 1. Ensure the officer has an active shift
    active_shift = db.query(Shift).filter(
        Shift.user_id == current_user.id, 
        Shift.end_time == None
    ).first()
    
    if not active_shift:
        raise HTTPException(status_code=400, detail="Must have an active shift to log patrols.")

    # 2. Record the checkpoint scan
    new_log = PatrolLog(
        shift_id=active_shift.id,
        site_id=log_data.site_id,
        scan_type=log_data.scan_type,
        photo_url=log_data.photo_url,
        photo_type=log_data.photo_type
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log