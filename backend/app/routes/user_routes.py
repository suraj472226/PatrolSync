from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database.connection import get_db
from ..models.user import User
from ..schemas.user_schema import UserResponse
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Master Management - Users"])

@router.get("/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Fetch all personnel."""
    return db.query(User).all()