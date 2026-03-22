from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float, Boolean
from datetime import datetime
from ..database.connection import Base


class LocationHistory(Base):
    """Tracks real-time location updates during shift for live monitoring"""
    __tablename__ = "location_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=False)

    # GPS coordinates
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float, nullable=True)  # Accuracy in meters
    altitude = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)     # Speed in m/s
    heading = Column(Float, nullable=True)   # Direction in degrees

    # Device status
    battery_level = Column(Integer, nullable=True)  # 0-100
    is_charging = Column(Boolean, nullable=True)

    # Timestamp
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
