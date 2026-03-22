from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Text, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from ..database.connection import Base


class ResponseStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    REVIEWED = "reviewed"


class ChecklistResponse(Base):
    """Stores completed checklist submissions from mobile app"""
    __tablename__ = "checklist_responses"

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)

    # Submission metadata
    status = Column(Enum(ResponseStatus), default=ResponseStatus.DRAFT, nullable=False)
    submitted_at = Column(DateTime, nullable=True)

    # Location at submission
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Signature capture (URL to stored signature image)
    signature_url = Column(String(255), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    answers = relationship("QuestionAnswer", back_populates="response", cascade="all, delete-orphan")
    checklist = relationship("Checklist", backref="responses")
    user = relationship("User", backref="checklist_responses")


class QuestionAnswer(Base):
    """Stores individual question answers within a checklist response"""
    __tablename__ = "question_answers"

    id = Column(Integer, primary_key=True, index=True)
    response_id = Column(Integer, ForeignKey("checklist_responses.id", ondelete="CASCADE"), nullable=False)
    question_link_id = Column(Integer, ForeignKey("checklist_question_links.id"), nullable=False)

    # Answer data
    answer_value = Column(String(255), nullable=True)  # "Yes", "No", "N/A", or multiple choice value
    comment = Column(Text, nullable=True)

    # Media attachments (JSON array of URLs)
    photo_urls = Column(Text, nullable=True)  # JSON array: '["url1", "url2"]'
    video_urls = Column(Text, nullable=True)  # JSON array
    doc_urls = Column(Text, nullable=True)    # JSON array

    # Compliance tracking
    is_compliant = Column(Boolean, default=True)
    flagged_at = Column(DateTime, nullable=True)

    # Timestamps
    answered_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    response = relationship("ChecklistResponse", back_populates="answers")
    question_link = relationship("ChecklistQuestionLink", backref="answers")
