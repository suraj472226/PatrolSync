from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
import json

from ..database.connection import get_db
from ..models.checklist import Question, Checklist, ChecklistQuestionLink
from ..models.checklist_response import ChecklistResponse as ChecklistResponseModel, QuestionAnswer, ResponseStatus
from ..models.user import User
from ..models.site import Company, Site
from ..schemas.checklist_schema import (
    QuestionCreate, QuestionUpdate, QuestionResponse,
    ChecklistCreate, ChecklistUpdate, ChecklistResponse, ChecklistQuestionResponse,
    PaginatedQuestions, PaginatedChecklists,
    QuestionStats, ChecklistStats
)

router = APIRouter(prefix="/assessments", tags=["Assessments & Checklists"])

# Helper to convert list to JSON string for storage
def list_to_json(data: Optional[List[str]]) -> Optional[str]:
    if data is None:
        return None
    return json.dumps(data)

# Helper to build question response with company name
def build_question_response(q: Question) -> dict:
    return {
        "id": q.id,
        "text": q.text,
        "response_type": q.response_type,
        "industry": q.industry,
        "region": q.region,
        "category": q.category,
        "company_id": q.company_id,
        "company_name": q.company.name if q.company else None,
        "tags": q.tags,
        "options": q.options
    }

# --- QUESTION BANK ROUTES ---

@router.get("/questions/stats", response_model=QuestionStats)
def get_question_stats(db: Session = Depends(get_db)):
    """Get statistics for the question bank"""
    total = db.query(func.count(Question.id)).scalar()

    # Count unique industries
    industries = db.query(func.count(func.distinct(Question.industry))).filter(
        Question.industry.isnot(None),
        Question.industry != ""
    ).scalar()

    # Calculate usage rate (questions used in at least one checklist)
    used_questions = db.query(func.count(func.distinct(ChecklistQuestionLink.question_id))).scalar()
    usage_rate = (used_questions / total * 100) if total > 0 else 0

    return QuestionStats(
        total_questions=total,
        active_industries=industries,
        avg_usage_rate=round(usage_rate, 1)
    )

@router.get("/questions", response_model=PaginatedQuestions)
def get_all_questions(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=1000),
    search: Optional[str] = None,
    industry: Optional[str] = None,
    category: Optional[str] = None,
    company_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Fetch questions with pagination and filters"""
    query = db.query(Question).options(joinedload(Question.company))

    # Apply filters
    if search:
        query = query.filter(Question.text.ilike(f"%{search}%"))
    if industry:
        query = query.filter(Question.industry == industry)
    if category:
        query = query.filter(Question.category == category)
    if company_id:
        query = query.filter(Question.company_id == company_id)

    # Get total count before pagination
    total = query.count()

    # Apply pagination
    questions = query.order_by(Question.id.desc()).offset(offset).limit(limit).all()

    return PaginatedQuestions(
        items=[build_question_response(q) for q in questions],
        total=total,
        offset=offset,
        limit=limit
    )

@router.get("/questions/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get a single question by ID"""
    q = db.query(Question).options(joinedload(Question.company)).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return build_question_response(q)

@router.post("/questions", response_model=QuestionResponse)
def create_question(question: QuestionCreate, db: Session = Depends(get_db)):
    """Add a new question to the global bank"""
    data = question.model_dump()
    # Convert lists to JSON strings for storage
    data['tags'] = list_to_json(data.get('tags'))
    data['options'] = list_to_json(data.get('options'))

    new_q = Question(**data)
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    # Reload with company relationship
    db.refresh(new_q)
    return build_question_response(new_q)

@router.put("/questions/{question_id}", response_model=QuestionResponse)
def update_question(question_id: int, question: QuestionUpdate, db: Session = Depends(get_db)):
    """Update an existing question"""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    update_data = question.model_dump(exclude_unset=True)

    # Convert lists to JSON strings for storage
    if 'tags' in update_data:
        update_data['tags'] = list_to_json(update_data['tags'])
    if 'options' in update_data:
        update_data['options'] = list_to_json(update_data['options'])

    for key, value in update_data.items():
        setattr(q, key, value)

    db.commit()
    db.refresh(q)
    return build_question_response(q)

@router.delete("/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    """Delete a question from the bank"""
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted successfully"}


# --- CHECKLIST ROUTES ---

@router.get("/checklists/stats", response_model=ChecklistStats)
def get_checklist_stats(db: Session = Depends(get_db)):
    """Get statistics for checklists"""
    total = db.query(func.count(Checklist.id)).scalar()
    active = db.query(func.count(Checklist.id)).filter(Checklist.is_active == True).scalar()
    questions_used = db.query(func.count(func.distinct(ChecklistQuestionLink.question_id))).scalar()

    return ChecklistStats(
        total_checklists=total,
        active_checklists=active,
        total_questions_used=questions_used
    )

@router.get("/checklists", response_model=PaginatedChecklists)
def get_all_checklists(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    industry: Optional[str] = None,
    company_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Fetch checklists with pagination and filters"""
    query = db.query(Checklist).options(joinedload(Checklist.company))

    # Apply filters
    if search:
        query = query.filter(Checklist.title.ilike(f"%{search}%"))
    if industry:
        query = query.filter(Checklist.industry == industry)
    if company_id:
        query = query.filter(Checklist.company_id == company_id)
    if is_active is not None:
        query = query.filter(Checklist.is_active == is_active)

    total = query.count()
    checklists = query.order_by(Checklist.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for c in checklists:
        question_count = db.query(func.count(ChecklistQuestionLink.id)).filter(
            ChecklistQuestionLink.checklist_id == c.id
        ).scalar()

        items.append(ChecklistResponse(
            id=c.id,
            title=c.title,
            industry=c.industry,
            description=c.description,
            company_id=c.company_id,
            company_name=c.company.name if c.company else None,
            is_active=c.is_active,
            created_at=c.created_at,
            question_count=question_count
        ))

    return PaginatedChecklists(
        items=items,
        total=total,
        offset=offset,
        limit=limit
    )

@router.get("/checklists/{checklist_id}", response_model=ChecklistResponse)
def get_checklist(checklist_id: int, db: Session = Depends(get_db)):
    """Get a single checklist with its questions"""
    c = db.query(Checklist).options(
        joinedload(Checklist.company),
        joinedload(Checklist.question_links).joinedload(ChecklistQuestionLink.question)
    ).filter(Checklist.id == checklist_id).first()

    if not c:
        raise HTTPException(status_code=404, detail="Checklist not found")

    questions = []
    for link in c.question_links:
        questions.append(ChecklistQuestionResponse(
            id=link.id,
            question_id=link.question_id,
            text=link.question.text,
            response_type=link.question.response_type,
            is_critical=link.is_critical,
            requires_photo=link.requires_photo,
            requires_video=link.requires_video,
            requires_doc=link.requires_doc,
            requires_comment=link.requires_comment
        ))

    return ChecklistResponse(
        id=c.id,
        title=c.title,
        industry=c.industry,
        description=c.description,
        company_id=c.company_id,
        company_name=c.company.name if c.company else None,
        is_active=c.is_active,
        created_at=c.created_at,
        question_count=len(questions),
        questions=questions
    )

@router.post("/checklists", response_model=ChecklistResponse)
def create_checklist(checklist: ChecklistCreate, db: Session = Depends(get_db)):
    """Save a newly composed checklist and link its specific rules"""
    try:
        new_checklist = Checklist(
            title=checklist.title,
            industry=checklist.industry,
            description=checklist.description,
            company_id=checklist.company_id
        )
        db.add(new_checklist)
        db.flush()

        for item in checklist.items:
            link = ChecklistQuestionLink(
                checklist_id=new_checklist.id,
                question_id=item.question_id,
                is_critical=item.is_critical,
                requires_photo=item.requires_photo,
                requires_video=item.requires_video,
                requires_doc=item.requires_doc,
                requires_comment=item.requires_comment
            )
            db.add(link)

        db.commit()
        db.refresh(new_checklist)

        return ChecklistResponse(
            id=new_checklist.id,
            title=new_checklist.title,
            industry=new_checklist.industry,
            description=new_checklist.description,
            company_id=new_checklist.company_id,
            is_active=new_checklist.is_active,
            created_at=new_checklist.created_at,
            question_count=len(checklist.items)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to save checklist: {str(e)}")

@router.put("/checklists/{checklist_id}", response_model=ChecklistResponse)
def update_checklist(checklist_id: int, checklist: ChecklistUpdate, db: Session = Depends(get_db)):
    """Update an existing checklist"""
    c = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Checklist not found")

    update_data = checklist.model_dump(exclude_unset=True)
    items = update_data.pop('items', None)

    # Update basic fields
    for key, value in update_data.items():
        setattr(c, key, value)

    # If items are provided, replace all question links
    if items is not None:
        # Get all existing links for this checklist
        existing_links = db.query(ChecklistQuestionLink).filter(
            ChecklistQuestionLink.checklist_id == checklist_id
        ).all()

        # Delete question answers first (to avoid foreign key constraint)
        for link in existing_links:
            db.query(QuestionAnswer).filter(
                QuestionAnswer.question_link_id == link.id
            ).delete()

        # Now delete the links
        db.query(ChecklistQuestionLink).filter(
            ChecklistQuestionLink.checklist_id == checklist_id
        ).delete()

        # Add new links
        for item in items:
            link = ChecklistQuestionLink(
                checklist_id=checklist_id,
                question_id=item['question_id'],
                is_critical=item.get('is_critical', False),
                requires_photo=item.get('requires_photo', False),
                requires_video=item.get('requires_video', False),
                requires_doc=item.get('requires_doc', False),
                requires_comment=item.get('requires_comment', False)
            )
            db.add(link)

    db.commit()
    db.refresh(c)

    question_count = db.query(func.count(ChecklistQuestionLink.id)).filter(
        ChecklistQuestionLink.checklist_id == c.id
    ).scalar()

    return ChecklistResponse(
        id=c.id,
        title=c.title,
        industry=c.industry,
        description=c.description,
        company_id=c.company_id,
        company_name=c.company.name if c.company else None,
        is_active=c.is_active,
        created_at=c.created_at,
        question_count=question_count
    )

@router.patch("/checklists/{checklist_id}/toggle")
def toggle_checklist_active(checklist_id: int, db: Session = Depends(get_db)):
    """Toggle the is_active status of a checklist"""
    c = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Checklist not found")

    c.is_active = not c.is_active
    db.commit()

    return {"id": c.id, "is_active": c.is_active}

@router.delete("/checklists/{checklist_id}")
def delete_checklist(checklist_id: int, db: Session = Depends(get_db)):
    """Delete a checklist"""
    c = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Checklist not found")
    db.delete(c)
    db.commit()
    return {"message": "Checklist deleted successfully"}


# --- COMPANY ROUTES (for dropdowns) ---

@router.get("/companies")
def get_companies(db: Session = Depends(get_db)):
    """Get all companies for dropdown selection"""
    companies = db.query(Company).order_by(Company.name).all()
    return [{"id": c.id, "name": c.name} for c in companies]


# --- FILTER OPTIONS ---

@router.get("/filter-options")
def get_filter_options(db: Session = Depends(get_db)):
    """Get unique values for filter dropdowns"""
    industries = db.query(Question.industry).distinct().filter(
        Question.industry.isnot(None),
        Question.industry != ""
    ).all()

    categories = db.query(Question.category).distinct().filter(
        Question.category.isnot(None),
        Question.category != ""
    ).all()

    return {
        "industries": [i[0] for i in industries],
        "categories": [c[0] for c in categories]
    }


# --- EMPLOYEE SUBMISSIONS (Admin View) ---

@router.get("/submissions")
def get_all_submissions(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    checklist_id: Optional[int] = None,
    user_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get all checklist submissions for admin view"""
    query = db.query(ChecklistResponseModel).options(
        joinedload(ChecklistResponseModel.checklist),
        joinedload(ChecklistResponseModel.user)
    )

    # Apply filters
    if status:
        if status == "submitted":
            query = query.filter(ChecklistResponseModel.status == ResponseStatus.SUBMITTED)
        elif status == "draft":
            query = query.filter(ChecklistResponseModel.status == ResponseStatus.DRAFT)
        elif status == "reviewed":
            query = query.filter(ChecklistResponseModel.status == ResponseStatus.REVIEWED)

    if checklist_id:
        query = query.filter(ChecklistResponseModel.checklist_id == checklist_id)

    if user_id:
        query = query.filter(ChecklistResponseModel.user_id == user_id)

    if date_from:
        query = query.filter(ChecklistResponseModel.created_at >= datetime.combine(date_from, datetime.min.time()))

    if date_to:
        query = query.filter(ChecklistResponseModel.created_at <= datetime.combine(date_to, datetime.max.time()))

    total = query.count()
    submissions = query.order_by(ChecklistResponseModel.created_at.desc()).offset(offset).limit(limit).all()

    items = []
    for s in submissions:
        # Get answer count
        answer_count = db.query(func.count(QuestionAnswer.id)).filter(
            QuestionAnswer.response_id == s.id,
            QuestionAnswer.answer_value.isnot(None)
        ).scalar()

        # Get total questions in checklist
        total_questions = db.query(func.count(ChecklistQuestionLink.id)).filter(
            ChecklistQuestionLink.checklist_id == s.checklist_id
        ).scalar()

        # Get site info
        site_name = None
        if s.site_id:
            site = db.query(Site).filter(Site.id == s.site_id).first()
            site_name = site.name if site else None

        items.append({
            "id": s.id,
            "checklist_id": s.checklist_id,
            "checklist_title": s.checklist.title if s.checklist else "Unknown",
            "user_id": s.user_id,
            "employee_id": s.user.employee_id if s.user else "Unknown",
            "employee_name": s.user.employee_id if s.user else "Unknown",
            "status": s.status.value,
            "site_name": site_name,
            "answered_questions": answer_count,
            "total_questions": total_questions,
            "completion_percentage": round((answer_count / total_questions * 100) if total_questions > 0 else 0),
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "has_signature": s.signature_url is not None
        })

    return {
        "items": items,
        "total": total,
        "offset": offset,
        "limit": limit
    }


@router.get("/submissions/stats")
def get_submission_stats(db: Session = Depends(get_db)):
    """Get statistics for checklist submissions"""
    total = db.query(func.count(ChecklistResponseModel.id)).scalar()
    submitted = db.query(func.count(ChecklistResponseModel.id)).filter(
        ChecklistResponseModel.status == ResponseStatus.SUBMITTED
    ).scalar()
    drafts = db.query(func.count(ChecklistResponseModel.id)).filter(
        ChecklistResponseModel.status == ResponseStatus.DRAFT
    ).scalar()
    reviewed = db.query(func.count(ChecklistResponseModel.id)).filter(
        ChecklistResponseModel.status == ResponseStatus.REVIEWED
    ).scalar()

    # Today's submissions
    today = datetime.utcnow().date()
    today_count = db.query(func.count(ChecklistResponseModel.id)).filter(
        func.date(ChecklistResponseModel.submitted_at) == today
    ).scalar()

    return {
        "total_submissions": total,
        "submitted": submitted,
        "drafts": drafts,
        "reviewed": reviewed,
        "today_submissions": today_count
    }


@router.get("/submissions/{submission_id}")
def get_submission_detail(submission_id: int, db: Session = Depends(get_db)):
    """Get detailed view of a checklist submission"""
    submission = db.query(ChecklistResponseModel).options(
        joinedload(ChecklistResponseModel.checklist),
        joinedload(ChecklistResponseModel.user),
        joinedload(ChecklistResponseModel.answers).joinedload(QuestionAnswer.question_link).joinedload(ChecklistQuestionLink.question)
    ).filter(ChecklistResponseModel.id == submission_id).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # Get site info
    site_name = None
    if submission.site_id:
        site = db.query(Site).filter(Site.id == submission.site_id).first()
        site_name = site.name if site else None

    # Build answers list
    answers = []
    for answer in submission.answers:
        question_text = "Unknown"
        is_critical = False
        if answer.question_link and answer.question_link.question:
            question_text = answer.question_link.question.text
            is_critical = answer.question_link.is_critical

        answers.append({
            "id": answer.id,
            "question_text": question_text,
            "is_critical": is_critical,
            "answer_value": answer.answer_value,
            "comment": answer.comment,
            "photo_urls": json.loads(answer.photo_urls) if answer.photo_urls else [],
            "video_urls": json.loads(answer.video_urls) if answer.video_urls else [],
            "doc_urls": json.loads(answer.doc_urls) if answer.doc_urls else [],
            "is_compliant": answer.is_compliant,
            "answered_at": answer.answered_at.isoformat() if answer.answered_at else None
        })

    return {
        "id": submission.id,
        "checklist_id": submission.checklist_id,
        "checklist_title": submission.checklist.title if submission.checklist else "Unknown",
        "user_id": submission.user_id,
        "employee_id": submission.user.employee_id if submission.user else "Unknown",
        "status": submission.status.value,
        "site_name": site_name,
        "latitude": submission.latitude,
        "longitude": submission.longitude,
        "signature_url": submission.signature_url,
        "created_at": submission.created_at.isoformat() if submission.created_at else None,
        "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
        "answers": answers
    }


@router.patch("/submissions/{submission_id}/review")
def mark_submission_reviewed(submission_id: int, db: Session = Depends(get_db)):
    """Mark a submission as reviewed by admin"""
    submission = db.query(ChecklistResponseModel).filter(
        ChecklistResponseModel.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    if submission.status != ResponseStatus.SUBMITTED:
        raise HTTPException(status_code=400, detail="Only submitted checklists can be reviewed")

    submission.status = ResponseStatus.REVIEWED
    db.commit()

    return {"id": submission_id, "status": "reviewed", "message": "Submission marked as reviewed"}

