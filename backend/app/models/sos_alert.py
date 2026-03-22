from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Text, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from ..database.connection import Base


class SOSAlertStatus(str, enum.Enum):
    TRIGGERED = "triggered"
    ACKNOWLEDGED = "acknowledged"
    RESPONDING = "responding"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"


class SOSAlert(Base):
    """Enhanced SOS tracking with full lifecycle management"""
    __tablename__ = "sos_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True)

    # Status tracking
    status = Column(Enum(SOSAlertStatus), default=SOSAlertStatus.TRIGGERED, nullable=False)

    # Location at trigger
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=True)  # Reverse geocoded address

    # Timing
    triggered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    # Response tracking
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="sos_alerts")
    acknowledger = relationship("User", foreign_keys=[acknowledged_by])
    incident = relationship("Incident", backref="sos_alert")
