from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from ..database.connection import Base

class ScanType(str, enum.Enum):
    QR_CODE = "QR Code"
    GPS = "GPS"
    NFC = "NFC"

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Shift start & end punch with mandatory GPS capture 
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    start_latitude = Column(Float, nullable=False)
    start_longitude = Column(Float, nullable=False)
    end_latitude = Column(Float, nullable=True)
    end_longitude = Column(Float, nullable=True)

    # Relationships
    patrol_logs = relationship("PatrolLog", back_populates="shift")

class PatrolLog(Base):
    __tablename__ = "patrol_logs"

    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    
    # Checkpoint verification details 
    scan_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    scan_type = Column(Enum(ScanType), default=ScanType.GPS, nullable=False)
    
    # Photo Audit (Live Camera Only) - storing the URL/path to the uploaded image 
    photo_url = Column(String(255), nullable=True)
    photo_type = Column(String(50), nullable=True) # e.g., "Main gate", "Guard turnout" 

    # Relationships
    shift = relationship("Shift", back_populates="patrol_logs")