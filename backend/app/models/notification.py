from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database.connection import Base


class NotificationType(enum.Enum):
    CHECKLIST_SUBMITTED = "checklist_submitted"
    INCIDENT_REPORTED = "incident_reported"
    SOS_TRIGGERED = "sos_triggered"
    SHIFT_STARTED = "shift_started"
    SHIFT_ENDED = "shift_ended"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(SQLEnum(NotificationType), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # The field officer
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    reference_id = Column(Integer, nullable=True)  # ID of related resource (checklist_response_id, incident_id, etc.)
    reference_type = Column(String(50), nullable=True)  # "checklist_response", "incident", "sos_alert", etc.
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    read_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User")
