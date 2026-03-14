from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database.connection import get_db
from ..models.site import Company
from ..schemas.location_schema import CompanyResponse
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/locations", tags=["Master Management - Locations"])

@router.get("/companies", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Fetch all companies and their associated sites."""
    return db.query(Company).all()