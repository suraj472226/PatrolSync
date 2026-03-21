from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.connection import Base

# 1. THE SECRET SAUCE: The Link Table
# This connects a question to a checklist AND stores the rules from Image 4
class ChecklistQuestionLink(Base):
    __tablename__ = "checklist_question_links"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))

    # The Composer Rules (From your guide's screenshots)
    is_critical = Column(Boolean, default=False) # Maps to "Requirement: Critical vs Standard"
    requires_photo = Column(Boolean, default=False)
    requires_video = Column(Boolean, default=False)
    requires_doc = Column(Boolean, default=False)
    requires_comment = Column(Boolean, default=False)

    # Relationships to navigate the chain
    checklist = relationship("Checklist", back_populates="question_links")
    question = relationship("Question", back_populates="checklist_links")


# 2. THE QUESTION BANK
class Question(Base):
    __tablename__ = "questions"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String(1000), nullable=False)
    response_type = Column(String(50), default="Yes / No / NA") # Yes/No/NA, Multiple Choice, Free Text
    industry = Column(String(100), nullable=True) # e.g., Manufacturing, Safety
    region = Column(String(100), nullable=True) # e.g., Global, APAC
    category = Column(String(50), nullable=True) # Safety & Health, Operational, Compliance, Quality Control
    tags = Column(Text, nullable=True) # JSON array string, e.g., '["Safety","Lab-Control"]'
    options = Column(Text, nullable=True) # JSON array for Multiple Choice options, e.g., '["Good","Average","Poor"]'

    # Company relationship
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    company = relationship("Company", backref="questions")

    # Link back to any checklists using this question
    checklist_links = relationship("ChecklistQuestionLink", back_populates="question", cascade="all, delete-orphan")


# 3. THE CHECKLIST
class Checklist(Base):
    __tablename__ = "checklists"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    industry = Column(String(100), nullable=True)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    # Company relationship
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    company = relationship("Company", backref="checklists")

    # Link down to the questions inside this checklist
    question_links = relationship("ChecklistQuestionLink", back_populates="checklist", cascade="all, delete-orphan")