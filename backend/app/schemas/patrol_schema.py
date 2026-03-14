from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class ScanType(str, Enum):
    QR_CODE = "QR Code"
    GPS = "GPS"
    NFC = "NFC"

# ---- SHIFT SCHEMAS ----

class ShiftStart(BaseModel):
    start_latitude: float # Mandatory GPS capture for shift start [cite: 50]
    start_longitude: float

class ShiftEnd(BaseModel):
    end_latitude: float
    end_longitude: float

class ShiftResponse(BaseModel):
    id: int
    user_id: int
    start_time: datetime
    start_latitude: float
    start_longitude: float
    end_time: Optional[datetime] = None

    class Config:
        from_attributes = True

# ---- PATROL LOG SCHEMAS ----

class PatrolLogCreate(BaseModel):
    site_id: int
    scan_type: ScanType
    # These become required if the app submits a photo audit [cite: 60]
    photo_url: Optional[str] = None 
    photo_type: Optional[str] = None 

class PatrolLogResponse(BaseModel):
    id: int
    shift_id: int
    site_id: int
    scan_time: datetime
    scan_type: ScanType
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True