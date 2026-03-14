from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, Float, Text
from datetime import datetime
from ..database.connection import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True) # Optional, incident might happen between sites
    
    # Incident Details
    category = Column(String(100), index=True, nullable=False) 
    remarks = Column(Text, nullable=True) 
    photo_url = Column(String(255), nullable=True) 
    
    # Auto location & time capture 
    reported_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    is_resolved = Column(Boolean, default=False)