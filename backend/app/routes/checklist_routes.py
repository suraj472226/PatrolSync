from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
import json

from ..database.connection import get_db
from ..models.checklist import Question, Checklist, ChecklistQuestionLink
from ..models.site import Company
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
        # Delete existing links
        db.query(ChecklistQuestionLink).filter(ChecklistQuestionLink.checklist_id == checklist_id).delete()

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
