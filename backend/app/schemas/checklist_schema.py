from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime
import json

# --- Question Schemas ---
class QuestionBase(BaseModel):
    text: str
    response_type: str = "Yes / No / NA"
    industry: Optional[str] = "General"
    region: Optional[str] = "Global"
    category: Optional[str] = None  # Safety & Health, Operational, Compliance, Quality Control
    company_id: Optional[int] = None
    tags: Optional[List[str]] = None  # Stored as JSON string in DB, handled as list in API
    options: Optional[List[str]] = None  # For Multiple Choice questions

class QuestionCreate(QuestionBase):
    pass

class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    response_type: Optional[str] = None
    industry: Optional[str] = None
    region: Optional[str] = None
    category: Optional[str] = None
    company_id: Optional[int] = None
    tags: Optional[List[str]] = None
    options: Optional[List[str]] = None

class QuestionResponse(BaseModel):
    id: int
    text: str
    response_type: str
    industry: Optional[str] = None
    region: Optional[str] = None
    category: Optional[str] = None
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    tags: Optional[List[str]] = None
    options: Optional[List[str]] = None

    class Config:
        from_attributes = True

    @field_validator('tags', 'options', mode='before')
    @classmethod
    def parse_json_string(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [v] if v else None
        return v

# --- Checklist Composer Schemas ---
class ChecklistItem(BaseModel):
    question_id: int
    is_critical: bool = False
    requires_photo: bool = False
    requires_video: bool = False
    requires_doc: bool = False
    requires_comment: bool = False

class ChecklistCreate(BaseModel):
    title: str
    industry: Optional[str] = None
    description: Optional[str] = None
    company_id: Optional[int] = None
    items: List[ChecklistItem]

class ChecklistUpdate(BaseModel):
    title: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    company_id: Optional[int] = None
    is_active: Optional[bool] = None
    items: Optional[List[ChecklistItem]] = None

class ChecklistQuestionResponse(BaseModel):
    id: int
    question_id: int
    text: str
    response_type: str
    is_critical: bool
    requires_photo: bool
    requires_video: bool
    requires_doc: bool
    requires_comment: bool

    class Config:
        from_attributes = True

class ChecklistResponse(BaseModel):
    id: int
    title: str
    industry: Optional[str] = None
    description: Optional[str] = None
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    question_count: int = 0
    questions: Optional[List[ChecklistQuestionResponse]] = None

    class Config:
        from_attributes = True

# --- Pagination Schemas ---
class PaginatedQuestions(BaseModel):
    items: List[QuestionResponse]
    total: int
    offset: int
    limit: int

class PaginatedChecklists(BaseModel):
    items: List[ChecklistResponse]
    total: int
    offset: int
    limit: int

# --- Stats Schema ---
class QuestionStats(BaseModel):
    total_questions: int
    active_industries: int
    avg_usage_rate: float

class ChecklistStats(BaseModel):
    total_checklists: int
    active_checklists: int
    total_questions_used: int
