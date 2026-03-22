from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from datetime import datetime, date, timedelta
from typing import Optional
import json

from ..database.connection import get_db
from ..core.dependencies import get_current_user
from ..models.user import User
from ..models.patrol import Shift, PatrolLog
from ..models.incident import Incident
from ..models.site import Site
from ..models.checklist import Checklist, ChecklistQuestionLink, Question
from ..models.checklist_response import ChecklistResponse, QuestionAnswer, ResponseStatus
from ..models.location_history import LocationHistory
from ..models.sos_alert import SOSAlert, SOSAlertStatus
from ..schemas.mobile_schema import (
    MobileDashboardResponse, OfficerInfo, ShiftInfo, ZoneInfo, StatusIndicators,
    PatrolActionItem, RecentLogItem, LocationUpdateRequest, LocationUpdateResponse,
    ChecklistStartRequest, ChecklistStartResponse, QuestionAnswerRequest,
    ChecklistSubmitRequest, ChecklistSubmitResponse, AssignedChecklistItem,
    ChecklistDetailForMobile, ChecklistQuestionForMobile,
    SOSTriggerRequest, SOSTriggerResponse, SOSCancelResponse, SOSStatusResponse,
    PaginatedActivity, ActivityItem, PatrolDetailResponse, ChecklistDetailResponse,
    IncidentDetailResponse, SOSDetailResponse, TimelineEvent
)
from ..models.notification import Notification, NotificationType

router = APIRouter(prefix="/mobile", tags=["Mobile App"])


# ==================== DASHBOARD ====================

@router.get("/dashboard", response_model=MobileDashboardResponse)
def get_mobile_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive dashboard data for mobile app"""

    # Officer info
    active_shift = db.query(Shift).filter(
        Shift.user_id == current_user.id,
        Shift.end_time == None
    ).first()

    officer = OfficerInfo(
        id=current_user.id,
        employee_id=current_user.employee_id,
        name=current_user.employee_id,  # Could be enhanced with name field
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        status="on_duty" if active_shift else "off_duty"
    )

    # Shift info
    shift_info = None
    if active_shift:
        elapsed = datetime.utcnow() - active_shift.start_time
        shift_info = ShiftInfo(
            id=active_shift.id,
            start_time=active_shift.start_time,
            elapsed_seconds=int(elapsed.total_seconds()),
            start_latitude=active_shift.start_latitude,
            start_longitude=active_shift.start_longitude
        )

    # Active zone (get from latest patrol log or shift location)
    zone_info = None
    if active_shift:
        latest_log = db.query(PatrolLog).filter(
            PatrolLog.shift_id == active_shift.id
        ).order_by(PatrolLog.scan_time.desc()).first()

        if latest_log:
            site = db.query(Site).filter(Site.id == latest_log.site_id).first()
            if site:
                zone_info = ZoneInfo(
                    id=site.id,
                    name=site.name,
                    address=site.name,  # Using name as address since Site doesn't have address field
                    latitude=site.latitude,
                    longitude=site.longitude
                )

    # Status indicators
    status = StatusIndicators(
        gps_status="active",  # Will be determined by mobile app
        sync_status="synced",
        battery_level=100,  # Will be sent from mobile
        pending_sync_count=0,
        last_sync=datetime.utcnow()
    )

    # Patrol actions with counts
    pending_checklists = db.query(Checklist).filter(Checklist.is_active == True).count()

    patrol_actions = [
        PatrolActionItem(type="scan", label="Scan Checkpoint", icon="qr-code"),
        PatrolActionItem(type="checklist", label="Checklist", icon="clipboard-check", count=pending_checklists),
        PatrolActionItem(type="incident", label="Incident", icon="alert-triangle")
    ]

    # Recent logs (last 10 activities)
    recent_logs = []

    if active_shift:
        # Get recent patrol logs
        patrol_logs = db.query(PatrolLog).filter(
            PatrolLog.shift_id == active_shift.id
        ).order_by(PatrolLog.scan_time.desc()).limit(5).all()

        for log in patrol_logs:
            site = db.query(Site).filter(Site.id == log.site_id).first()
            recent_logs.append(RecentLogItem(
                id=log.id,
                type="patrol",
                title=f"Checkpoint: {site.name if site else 'Unknown'}",
                timestamp=log.scan_time,
                status="completed"
            ))

    # Get recent incidents
    today = datetime.utcnow().date()
    incidents = db.query(Incident).filter(
        Incident.user_id == current_user.id,
        func.date(Incident.reported_at) == today
    ).order_by(Incident.reported_at.desc()).limit(3).all()

    for incident in incidents:
        recent_logs.append(RecentLogItem(
            id=incident.id,
            type="incident",
            title=f"Incident: {incident.category}",
            timestamp=incident.reported_at,
            status="resolved" if incident.is_resolved else "pending"
        ))

    # Sort recent logs by timestamp
    recent_logs.sort(key=lambda x: x.timestamp, reverse=True)
    recent_logs = recent_logs[:10]

    return MobileDashboardResponse(
        officer=officer,
        active_shift=shift_info,
        active_zone=zone_info,
        status_indicators=status,
        patrol_actions=patrol_actions,
        recent_logs=recent_logs
    )


# ==================== SHIFT & LOCATION ====================

@router.get("/shift/active")
def get_active_shift(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current active shift with elapsed time"""
    active_shift = db.query(Shift).filter(
        Shift.user_id == current_user.id,
        Shift.end_time == None
    ).first()

    if not active_shift:
        return {"active": False}

    elapsed = datetime.utcnow() - active_shift.start_time
    return {
        "active": True,
        "shift_id": active_shift.id,
        "start_time": active_shift.start_time,
        "elapsed_seconds": int(elapsed.total_seconds()),
        "start_latitude": active_shift.start_latitude,
        "start_longitude": active_shift.start_longitude
    }


@router.post("/shift/location", response_model=LocationUpdateResponse)
def update_location(
    location: LocationUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit periodic location update during shift"""
    active_shift = db.query(Shift).filter(
        Shift.user_id == current_user.id,
        Shift.end_time == None
    ).first()

    if not active_shift:
        raise HTTPException(status_code=400, detail="No active shift found")

    location_record = LocationHistory(
        user_id=current_user.id,
        shift_id=active_shift.id,
        latitude=location.latitude,
        longitude=location.longitude,
        accuracy=location.accuracy,
        altitude=location.altitude,
        speed=location.speed,
        heading=location.heading,
        battery_level=location.battery_level,
        is_charging=location.is_charging
    )

    db.add(location_record)
    db.commit()

    return LocationUpdateResponse(success=True, recorded_at=location_record.recorded_at)


# ==================== CHECKLISTS ====================

@router.get("/checklists/assigned")
def get_assigned_checklists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of checklists assigned to user (active checklists)"""
    checklists = db.query(Checklist).filter(Checklist.is_active == True).all()

    result = []
    for checklist in checklists:
        # Count questions
        question_count = db.query(ChecklistQuestionLink).filter(
            ChecklistQuestionLink.checklist_id == checklist.id
        ).count()

        # Check for existing draft
        draft = db.query(ChecklistResponse).filter(
            ChecklistResponse.checklist_id == checklist.id,
            ChecklistResponse.user_id == current_user.id,
            ChecklistResponse.status == ResponseStatus.DRAFT
        ).first()

        draft_progress = 0
        if draft:
            answered_count = db.query(QuestionAnswer).filter(
                QuestionAnswer.response_id == draft.id,
                QuestionAnswer.answer_value != None
            ).count()
            draft_progress = int((answered_count / question_count * 100)) if question_count > 0 else 0

        result.append(AssignedChecklistItem(
            id=checklist.id,
            title=checklist.title,
            industry=checklist.industry,
            description=checklist.description,
            question_count=question_count,
            has_draft=draft is not None,
            draft_response_id=draft.id if draft else None,
            draft_progress=draft_progress
        ))

    return result


@router.get("/checklists/{checklist_id}")
def get_checklist_for_mobile(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get checklist with questions for mobile form"""
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    # Get questions with links
    links = db.query(ChecklistQuestionLink).filter(
        ChecklistQuestionLink.checklist_id == checklist_id
    ).all()

    # Check for existing draft
    draft = db.query(ChecklistResponse).filter(
        ChecklistResponse.checklist_id == checklist_id,
        ChecklistResponse.user_id == current_user.id,
        ChecklistResponse.status == ResponseStatus.DRAFT
    ).first()

    questions = []
    for link in links:
        question = db.query(Question).filter(Question.id == link.question_id).first()
        if question:
            # Get existing answer if draft exists
            current_answer = None
            current_comment = None
            current_photos = None
            current_videos = None
            current_docs = None

            if draft:
                answer = db.query(QuestionAnswer).filter(
                    QuestionAnswer.response_id == draft.id,
                    QuestionAnswer.question_link_id == link.id
                ).first()
                if answer:
                    current_answer = answer.answer_value
                    current_comment = answer.comment
                    current_photos = answer.photo_urls
                    current_videos = answer.video_urls
                    current_docs = answer.doc_urls

            questions.append(ChecklistQuestionForMobile(
                link_id=link.id,
                question_id=question.id,
                text=question.text,
                response_type=question.response_type,
                options=question.options,
                is_critical=link.is_critical,
                requires_photo=link.requires_photo,
                requires_video=link.requires_video,
                requires_doc=link.requires_doc,
                requires_comment=link.requires_comment,
                current_answer=current_answer,
                current_comment=current_comment,
                current_photos=current_photos,
                current_videos=current_videos,
                current_docs=current_docs
            ))

    answered_count = sum(1 for q in questions if q.current_answer is not None)
    progress = int((answered_count / len(questions) * 100)) if questions else 0

    return ChecklistDetailForMobile(
        id=checklist.id,
        title=checklist.title,
        description=checklist.description,
        questions=questions,
        response_id=draft.id if draft else None,
        progress=progress
    )


@router.post("/checklists/{checklist_id}/start", response_model=ChecklistStartResponse)
def start_checklist(
    checklist_id: int,
    start_data: ChecklistStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a checklist (create draft response)"""
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")

    # Check for existing draft
    existing_draft = db.query(ChecklistResponse).filter(
        ChecklistResponse.checklist_id == checklist_id,
        ChecklistResponse.user_id == current_user.id,
        ChecklistResponse.status == ResponseStatus.DRAFT
    ).first()

    if existing_draft:
        return ChecklistStartResponse(
            response_id=existing_draft.id,
            checklist_id=checklist_id,
            checklist_title=checklist.title,
            created_at=existing_draft.created_at
        )

    # Get active shift
    active_shift = db.query(Shift).filter(
        Shift.user_id == current_user.id,
        Shift.end_time == None
    ).first()

    # Create new response
    response = ChecklistResponse(
        checklist_id=checklist_id,
        user_id=current_user.id,
        shift_id=active_shift.id if active_shift else None,
        site_id=start_data.site_id,
        latitude=start_data.latitude,
        longitude=start_data.longitude,
        status=ResponseStatus.DRAFT
    )

    db.add(response)
    db.commit()
    db.refresh(response)

    return ChecklistStartResponse(
        response_id=response.id,
        checklist_id=checklist_id,
        checklist_title=checklist.title,
        created_at=response.created_at
    )


@router.patch("/checklists/responses/{response_id}/answer")
def save_answer(
    response_id: int,
    answer_data: QuestionAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save individual question answer"""
    response = db.query(ChecklistResponse).filter(
        ChecklistResponse.id == response_id,
        ChecklistResponse.user_id == current_user.id
    ).first()

    if not response:
        raise HTTPException(status_code=404, detail="Response not found or access denied")

    if response.status != ResponseStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Cannot modify submitted response")

    # Verify question_link_id exists
    question_link = db.query(ChecklistQuestionLink).filter(
        ChecklistQuestionLink.id == answer_data.question_link_id,
        ChecklistQuestionLink.checklist_id == response.checklist_id
    ).first()

    if not question_link:
        raise HTTPException(status_code=400, detail="Invalid question_link_id for this checklist")

    try:
        # Find or create answer
        existing_answer = db.query(QuestionAnswer).filter(
            QuestionAnswer.response_id == response_id,
            QuestionAnswer.question_link_id == answer_data.question_link_id
        ).first()

        if existing_answer:
            existing_answer.answer_value = answer_data.answer_value
            existing_answer.comment = answer_data.comment
            existing_answer.photo_urls = json.dumps(answer_data.photo_urls) if answer_data.photo_urls else None
            existing_answer.video_urls = json.dumps(answer_data.video_urls) if answer_data.video_urls else None
            existing_answer.doc_urls = json.dumps(answer_data.doc_urls) if answer_data.doc_urls else None
            existing_answer.answered_at = datetime.utcnow()
        else:
            new_answer = QuestionAnswer(
                response_id=response_id,
                question_link_id=answer_data.question_link_id,
                answer_value=answer_data.answer_value,
                comment=answer_data.comment,
                photo_urls=json.dumps(answer_data.photo_urls) if answer_data.photo_urls else None,
                video_urls=json.dumps(answer_data.video_urls) if answer_data.video_urls else None,
                doc_urls=json.dumps(answer_data.doc_urls) if answer_data.doc_urls else None
            )
            db.add(new_answer)

        response.updated_at = datetime.utcnow()
        db.commit()

        return {"success": True, "message": "Answer saved"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to save answer: {str(e)}")


@router.post("/checklists/responses/{response_id}/submit", response_model=ChecklistSubmitResponse)
def submit_checklist(
    response_id: int,
    submit_data: ChecklistSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Final submission with signature"""
    response = db.query(ChecklistResponse).filter(
        ChecklistResponse.id == response_id,
        ChecklistResponse.user_id == current_user.id
    ).first()

    if not response:
        raise HTTPException(status_code=404, detail="Response not found")

    if response.status != ResponseStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Response already submitted")

    response.status = ResponseStatus.SUBMITTED
    response.submitted_at = datetime.utcnow()
    response.signature_url = submit_data.signature_url
    response.latitude = submit_data.latitude
    response.longitude = submit_data.longitude

    # Get checklist details for notification
    checklist = db.query(Checklist).filter(Checklist.id == response.checklist_id).first()
    checklist_title = checklist.title if checklist else "Checklist"

    # Create notification for admins
    notification = Notification(
        type=NotificationType.CHECKLIST_SUBMITTED,
        user_id=current_user.id,
        title=f"Checklist Submitted: {checklist_title}",
        message=f"{current_user.employee_id} submitted {checklist_title}",
        reference_id=response.id,
        reference_type="checklist_response"
    )
    db.add(notification)

    db.commit()
    db.refresh(response)

    return ChecklistSubmitResponse(
        response_id=response.id,
        status="submitted",
        submitted_at=response.submitted_at,
        message="Checklist submitted successfully"
    )


# ==================== SOS ====================

@router.post("/sos/trigger", response_model=SOSTriggerResponse)
def trigger_sos(
    sos_data: SOSTriggerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trigger SOS alert"""
    # Get active shift
    active_shift = db.query(Shift).filter(
        Shift.user_id == current_user.id,
        Shift.end_time == None
    ).first()

    # Create SOS alert
    sos = SOSAlert(
        user_id=current_user.id,
        shift_id=active_shift.id if active_shift else None,
        latitude=sos_data.latitude,
        longitude=sos_data.longitude,
        address=sos_data.address,
        status=SOSAlertStatus.TRIGGERED
    )

    db.add(sos)
    db.commit()
    db.refresh(sos)

    # Also create an incident record for tracking
    incident = Incident(
        user_id=current_user.id,
        category="EMERGENCY_SOS",
        remarks=f"SOS Alert triggered at {sos_data.address or 'Unknown location'}",
        latitude=sos_data.latitude,
        longitude=sos_data.longitude
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    # Link incident to SOS
    sos.incident_id = incident.id
    db.commit()

    # Create notification for admins
    notification = Notification(
        type=NotificationType.SOS_TRIGGERED,
        user_id=current_user.id,
        title="🚨 SOS ALERT TRIGGERED",
        message=f"{current_user.employee_id} triggered SOS at {sos_data.address or 'Unknown location'}",
        reference_id=sos.id,
        reference_type="sos_alert"
    )
    db.add(notification)
    db.commit()

    return SOSTriggerResponse(
        id=sos.id,
        status=sos.status.value,
        triggered_at=sos.triggered_at,
        message="SOS alert triggered! Help is on the way."
    )


@router.post("/sos/{sos_id}/cancel", response_model=SOSCancelResponse)
def cancel_sos(
    sos_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel SOS alert"""
    sos = db.query(SOSAlert).filter(
        SOSAlert.id == sos_id,
        SOSAlert.user_id == current_user.id
    ).first()

    if not sos:
        raise HTTPException(status_code=404, detail="SOS alert not found")

    if sos.status not in [SOSAlertStatus.TRIGGERED, SOSAlertStatus.ACKNOWLEDGED]:
        raise HTTPException(status_code=400, detail="Cannot cancel this SOS alert")

    sos.status = SOSAlertStatus.CANCELLED
    sos.resolved_at = datetime.utcnow()
    sos.resolution_notes = "Cancelled by user"

    db.commit()

    return SOSCancelResponse(
        id=sos.id,
        status="cancelled",
        message="SOS alert cancelled"
    )


@router.get("/sos/{sos_id}/status", response_model=SOSStatusResponse)
def get_sos_status(
    sos_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get SOS status"""
    sos = db.query(SOSAlert).filter(
        SOSAlert.id == sos_id,
        SOSAlert.user_id == current_user.id
    ).first()

    if not sos:
        raise HTTPException(status_code=404, detail="SOS alert not found")

    acknowledger_name = None
    if sos.acknowledged_by:
        acknowledger = db.query(User).filter(User.id == sos.acknowledged_by).first()
        acknowledger_name = acknowledger.employee_id if acknowledger else None

    return SOSStatusResponse(
        id=sos.id,
        status=sos.status.value,
        triggered_at=sos.triggered_at,
        acknowledged_at=sos.acknowledged_at,
        acknowledged_by_name=acknowledger_name,
        resolved_at=sos.resolved_at,
        resolution_notes=sos.resolution_notes
    )


# ==================== ACTIVITY HISTORY ====================

@router.get("/activity", response_model=PaginatedActivity)
def get_activity_history(
    status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    activity_type: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated activity history with filters"""
    activities = []

    # Get patrol logs
    if activity_type is None or activity_type == "patrol":
        patrol_query = db.query(PatrolLog).join(Shift).filter(
            Shift.user_id == current_user.id
        )

        if date_from:
            patrol_query = patrol_query.filter(PatrolLog.scan_time >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            patrol_query = patrol_query.filter(PatrolLog.scan_time <= datetime.combine(date_to, datetime.max.time()))

        patrols = patrol_query.all()
        for log in patrols:
            site = db.query(Site).filter(Site.id == log.site_id).first()
            activities.append(ActivityItem(
                id=log.id,
                type="patrol",
                title=f"Checkpoint: {site.name if site else 'Unknown'}",
                status="completed",
                timestamp=log.scan_time,
                location=site.name if site else None,
                summary=f"Scanned via {log.scan_type.value if hasattr(log.scan_type, 'value') else log.scan_type}"
            ))

    # Get checklist responses
    if activity_type is None or activity_type == "checklist":
        checklist_query = db.query(ChecklistResponse).filter(
            ChecklistResponse.user_id == current_user.id
        )

        if status == "submitted":
            checklist_query = checklist_query.filter(ChecklistResponse.status == ResponseStatus.SUBMITTED)
        elif status == "pending":
            checklist_query = checklist_query.filter(ChecklistResponse.status == ResponseStatus.DRAFT)

        if date_from:
            checklist_query = checklist_query.filter(ChecklistResponse.created_at >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            checklist_query = checklist_query.filter(ChecklistResponse.created_at <= datetime.combine(date_to, datetime.max.time()))

        responses = checklist_query.all()
        for resp in responses:
            checklist = db.query(Checklist).filter(Checklist.id == resp.checklist_id).first()
            status_str = "completed" if resp.status == ResponseStatus.SUBMITTED else "in_progress"
            activities.append(ActivityItem(
                id=resp.id,
                type="checklist",
                title=checklist.title if checklist else "Checklist",
                status=status_str,
                timestamp=resp.submitted_at or resp.created_at,
                summary=f"Status: {resp.status.value}"
            ))

    # Get incidents
    if activity_type is None or activity_type == "incident":
        incident_query = db.query(Incident).filter(
            Incident.user_id == current_user.id
        )

        if date_from:
            incident_query = incident_query.filter(Incident.reported_at >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            incident_query = incident_query.filter(Incident.reported_at <= datetime.combine(date_to, datetime.max.time()))

        incidents = incident_query.all()
        for incident in incidents:
            activities.append(ActivityItem(
                id=incident.id,
                type="incident",
                title=f"Incident: {incident.category}",
                status="resolved" if incident.is_resolved else "pending",
                timestamp=incident.reported_at,
                summary=incident.remarks[:100] if incident.remarks else None
            ))

    # Get SOS alerts
    if activity_type is None or activity_type == "sos":
        sos_query = db.query(SOSAlert).filter(
            SOSAlert.user_id == current_user.id
        )

        if date_from:
            sos_query = sos_query.filter(SOSAlert.triggered_at >= datetime.combine(date_from, datetime.min.time()))
        if date_to:
            sos_query = sos_query.filter(SOSAlert.triggered_at <= datetime.combine(date_to, datetime.max.time()))

        sos_alerts = sos_query.all()
        for sos in sos_alerts:
            activities.append(ActivityItem(
                id=sos.id,
                type="sos",
                title="SOS Alert",
                status=sos.status.value,
                timestamp=sos.triggered_at,
                location=sos.address,
                summary=f"Status: {sos.status.value}"
            ))

    # Search filter
    if search:
        search_lower = search.lower()
        activities = [a for a in activities if search_lower in a.title.lower() or (a.summary and search_lower in a.summary.lower())]

    # Sort by timestamp descending
    activities.sort(key=lambda x: x.timestamp, reverse=True)

    total = len(activities)
    activities = activities[offset:offset + limit]

    return PaginatedActivity(
        items=activities,
        total=total,
        offset=offset,
        limit=limit
    )


@router.get("/activity/patrol/{patrol_id}", response_model=PatrolDetailResponse)
def get_patrol_detail(
    patrol_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed patrol log"""
    log = db.query(PatrolLog).filter(PatrolLog.id == patrol_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Patrol log not found")

    shift = db.query(Shift).filter(Shift.id == log.shift_id).first()
    if shift.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    site = db.query(Site).filter(Site.id == log.site_id).first()

    timeline = [
        TimelineEvent(
            timestamp=shift.start_time,
            event="Shift Started",
            description="Officer began shift"
        ),
        TimelineEvent(
            timestamp=log.scan_time,
            event="Checkpoint Scanned",
            description=f"Verified via {log.scan_type.value if hasattr(log.scan_type, 'value') else log.scan_type}"
        )
    ]

    return PatrolDetailResponse(
        id=log.id,
        scan_time=log.scan_time,
        scan_type=log.scan_type.value if hasattr(log.scan_type, 'value') else str(log.scan_type),
        site_name=site.name if site else "Unknown",
        site_address=site.name if site else None,
        latitude=site.latitude if site else None,
        longitude=site.longitude if site else None,
        photo_url=log.photo_url,
        shift_start_time=shift.start_time,
        timeline=timeline
    )


@router.get("/activity/checklist/{response_id}", response_model=ChecklistDetailResponse)
def get_checklist_response_detail(
    response_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed checklist response"""
    response = db.query(ChecklistResponse).filter(
        ChecklistResponse.id == response_id,
        ChecklistResponse.user_id == current_user.id
    ).first()

    if not response:
        raise HTTPException(status_code=404, detail="Checklist response not found")

    checklist = db.query(Checklist).filter(Checklist.id == response.checklist_id).first()

    # Get answers summary
    answers = db.query(QuestionAnswer).filter(QuestionAnswer.response_id == response_id).all()
    total_questions = db.query(ChecklistQuestionLink).filter(
        ChecklistQuestionLink.checklist_id == response.checklist_id
    ).count()

    answers_summary = []
    for answer in answers:
        link = db.query(ChecklistQuestionLink).filter(ChecklistQuestionLink.id == answer.question_link_id).first()
        question = db.query(Question).filter(Question.id == link.question_id).first() if link else None
        answers_summary.append({
            "question": question.text if question else "Unknown",
            "answer": answer.answer_value,
            "comment": answer.comment,
            "has_attachments": bool(answer.photo_urls or answer.video_urls or answer.doc_urls)
        })

    site = db.query(Site).filter(Site.id == response.site_id).first() if response.site_id else None

    timeline = [
        TimelineEvent(
            timestamp=response.created_at,
            event="Started",
            description="Checklist form opened"
        )
    ]

    if response.submitted_at:
        timeline.append(TimelineEvent(
            timestamp=response.submitted_at,
            event="Submitted",
            description="Checklist completed and submitted"
        ))

    return ChecklistDetailResponse(
        id=response.id,
        checklist_title=checklist.title if checklist else "Unknown",
        status=response.status.value,
        submitted_at=response.submitted_at,
        site_name=site.name if site else None,
        total_questions=total_questions,
        answered_questions=len(answers),
        answers_summary=answers_summary,
        signature_url=response.signature_url,
        timeline=timeline
    )


@router.get("/activity/incident/{incident_id}", response_model=IncidentDetailResponse)
def get_incident_detail(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed incident"""
    incident = db.query(Incident).filter(
        Incident.id == incident_id,
        Incident.user_id == current_user.id
    ).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    site = db.query(Site).filter(Site.id == incident.site_id).first() if incident.site_id else None

    timeline = [
        TimelineEvent(
            timestamp=incident.reported_at,
            event="Reported",
            description=f"Incident reported: {incident.category}"
        )
    ]

    if incident.is_resolved:
        timeline.append(TimelineEvent(
            timestamp=incident.reported_at,  # Would need resolved_at field for accurate time
            event="Resolved",
            description="Incident marked as resolved"
        ))

    return IncidentDetailResponse(
        id=incident.id,
        category=incident.category,
        remarks=incident.remarks,
        photo_url=incident.photo_url,
        reported_at=incident.reported_at,
        latitude=incident.latitude,
        longitude=incident.longitude,
        is_resolved=incident.is_resolved,
        site_name=site.name if site else None,
        timeline=timeline
    )


@router.get("/activity/sos/{sos_id}", response_model=SOSDetailResponse)
def get_sos_detail(
    sos_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed SOS alert"""
    sos = db.query(SOSAlert).filter(
        SOSAlert.id == sos_id,
        SOSAlert.user_id == current_user.id
    ).first()

    if not sos:
        raise HTTPException(status_code=404, detail="SOS alert not found")

    acknowledger_name = None
    if sos.acknowledged_by:
        acknowledger = db.query(User).filter(User.id == sos.acknowledged_by).first()
        acknowledger_name = acknowledger.employee_id if acknowledger else None

    timeline = [
        TimelineEvent(
            timestamp=sos.triggered_at,
            event="Triggered",
            description="SOS alert triggered",
            actor=current_user.employee_id
        )
    ]

    if sos.acknowledged_at:
        timeline.append(TimelineEvent(
            timestamp=sos.acknowledged_at,
            event="Acknowledged",
            description="Help is on the way",
            actor=acknowledger_name
        ))

    if sos.resolved_at:
        timeline.append(TimelineEvent(
            timestamp=sos.resolved_at,
            event="Resolved",
            description=sos.resolution_notes or "Alert resolved"
        ))

    return SOSDetailResponse(
        id=sos.id,
        status=sos.status.value,
        triggered_at=sos.triggered_at,
        latitude=sos.latitude,
        longitude=sos.longitude,
        address=sos.address,
        acknowledged_at=sos.acknowledged_at,
        acknowledged_by_name=acknowledger_name,
        resolved_at=sos.resolved_at,
        resolution_notes=sos.resolution_notes,
        timeline=timeline
    )
