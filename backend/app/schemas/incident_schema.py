from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class IncidentCreate(BaseModel):
    site_id: Optional[int] = None
    category: str
    remarks: Optional[str] = None
    photo_url: Optional[str] = None
    latitude: float
    longitude: float

class SOSAlert(BaseModel):
    latitude: float
    longitude: float

class IncidentResponse(BaseModel):
    id: int
    user_id: int
    site_id: Optional[int]
    category: str
    remarks: Optional[str]
    photo_url: Optional[str]
    reported_at: datetime
    latitude: float
    longitude: float

    is_resolved: bool

    class Config:
        from_attributes = True