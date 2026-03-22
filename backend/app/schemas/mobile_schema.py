from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime, date
import json


# ==================== DASHBOARD SCHEMAS ====================

class OfficerInfo(BaseModel):
    id: int
    employee_id: str
    name: str
    role: str
    status: str  # "on_duty" | "off_duty"
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class ShiftInfo(BaseModel):
    id: int
    start_time: datetime
    elapsed_seconds: int
    start_latitude: float
    start_longitude: float

    class Config:
        from_attributes = True


class ZoneInfo(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


class StatusIndicators(BaseModel):
    gps_status: str  # "active" | "inactive" | "error"
    sync_status: str  # "synced" | "pending" | "offline"
    battery_level: int
    pending_sync_count: int
    last_sync: Optional[datetime] = None


class PatrolActionItem(BaseModel):
    type: str  # "scan" | "checklist" | "incident"
    label: str
    icon: str
    count: Optional[int] = None  # e.g., pending checklists count


class RecentLogItem(BaseModel):
    id: int
    type: str  # "patrol" | "checklist" | "incident"
    title: str
    timestamp: datetime
    status: str

    class Config:
        from_attributes = True


class MobileDashboardResponse(BaseModel):
    officer: OfficerInfo
    active_shift: Optional[ShiftInfo] = None
    active_zone: Optional[ZoneInfo] = None
    status_indicators: StatusIndicators
    patrol_actions: List[PatrolActionItem]
    recent_logs: List[RecentLogItem]


# ==================== SHIFT & LOCATION SCHEMAS ====================

class LocationUpdateRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    altitude: Optional[float] = None
    speed: Optional[float] = None
    heading: Optional[float] = None
    battery_level: Optional[int] = None
    is_charging: Optional[bool] = None


class LocationUpdateResponse(BaseModel):
    success: bool
    recorded_at: datetime


# ==================== CHECKLIST SUBMISSION SCHEMAS ====================

class ChecklistStartRequest(BaseModel):
    site_id: Optional[int] = None
    latitude: float
    longitude: float


class ChecklistStartResponse(BaseModel):
    response_id: int
    checklist_id: int
    checklist_title: str
    created_at: datetime


class QuestionAnswerRequest(BaseModel):
    question_link_id: int
    answer_value: Optional[str] = None
    comment: Optional[str] = None
    photo_urls: Optional[List[str]] = None
    video_urls: Optional[List[str]] = None
    doc_urls: Optional[List[str]] = None


class ChecklistSubmitRequest(BaseModel):
    signature_url: str
    latitude: float
    longitude: float


class ChecklistSubmitResponse(BaseModel):
    response_id: int
    status: str
    submitted_at: datetime
    message: str


class AssignedChecklistItem(BaseModel):
    id: int
    title: str
    industry: Optional[str] = None
    description: Optional[str] = None
    question_count: int
    has_draft: bool = False
    draft_response_id: Optional[int] = None
    draft_progress: int = 0  # percentage 0-100

    class Config:
        from_attributes = True


class ChecklistQuestionForMobile(BaseModel):
    link_id: int
    question_id: int
    text: str
    response_type: str
    options: Optional[List[str]] = None
    is_critical: bool
    requires_photo: bool
    requires_video: bool
    requires_doc: bool
    requires_comment: bool
    # Current answer if draft exists
    current_answer: Optional[str] = None
    current_comment: Optional[str] = None
    current_photos: Optional[List[str]] = None
    current_videos: Optional[List[str]] = None
    current_docs: Optional[List[str]] = None

    class Config:
        from_attributes = True

    @field_validator('options', 'current_photos', 'current_videos', 'current_docs', mode='before')
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


class ChecklistDetailForMobile(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    questions: List[ChecklistQuestionForMobile]
    response_id: Optional[int] = None  # If draft exists
    progress: int = 0

    class Config:
        from_attributes = True


# ==================== SOS SCHEMAS ====================

class SOSTriggerRequest(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None


class SOSTriggerResponse(BaseModel):
    id: int
    status: str
    triggered_at: datetime
    message: str


class SOSCancelResponse(BaseModel):
    id: int
    status: str
    message: str


class SOSStatusResponse(BaseModel):
    id: int
    status: str
    triggered_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_name: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None


# ==================== ACTIVITY HISTORY SCHEMAS ====================

class ActivityFilterParams(BaseModel):
    status: Optional[str] = None  # "submitted" | "pending" | "all"
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    search: Optional[str] = None
    activity_type: Optional[str] = None  # "patrol" | "checklist" | "incident" | "sos"


class ActivityItem(BaseModel):
    id: int
    type: str  # "patrol" | "checklist" | "incident" | "sos"
    title: str
    status: str  # "completed" | "pending" | "overdue" | "in_progress"
    timestamp: datetime
    location: Optional[str] = None
    summary: Optional[str] = None

    class Config:
        from_attributes = True


class PaginatedActivity(BaseModel):
    items: List[ActivityItem]
    total: int
    offset: int
    limit: int


# ==================== ACTIVITY DETAIL SCHEMAS ====================

class TimelineEvent(BaseModel):
    timestamp: datetime
    event: str
    description: Optional[str] = None
    actor: Optional[str] = None


class PatrolDetailResponse(BaseModel):
    id: int
    scan_time: datetime
    scan_type: str
    site_name: str
    site_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_url: Optional[str] = None
    shift_start_time: datetime
    timeline: List[TimelineEvent]

    class Config:
        from_attributes = True


class ChecklistDetailResponse(BaseModel):
    id: int
    checklist_title: str
    status: str
    submitted_at: Optional[datetime] = None
    site_name: Optional[str] = None
    total_questions: int
    answered_questions: int
    answers_summary: List[dict]
    signature_url: Optional[str] = None
    timeline: List[TimelineEvent]

    class Config:
        from_attributes = True


class IncidentDetailResponse(BaseModel):
    id: int
    category: str
    remarks: Optional[str] = None
    photo_url: Optional[str] = None
    reported_at: datetime
    latitude: float
    longitude: float
    is_resolved: bool
    site_name: Optional[str] = None
    timeline: List[TimelineEvent]

    class Config:
        from_attributes = True


class SOSDetailResponse(BaseModel):
    id: int
    status: str
    triggered_at: datetime
    latitude: float
    longitude: float
    address: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_name: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    timeline: List[TimelineEvent]

    class Config:
        from_attributes = True


# ==================== FILE UPLOAD SCHEMAS ====================

class FileUploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str
    size: int


class SignatureUploadRequest(BaseModel):
    base64_data: str
    filename: Optional[str] = "signature.png"


class SignatureUploadResponse(BaseModel):
    url: str
