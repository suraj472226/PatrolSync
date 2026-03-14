from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..schemas.user_schema import UserLogin
from ..services import auth_service
from ..core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate user and return a JWT Bearer token.
    Enforces strict device binding[cite: 47].
    """
    user = auth_service.authenticate_user(db, login_data)
    
    # Generate JWT Access Token using the user's ID and Role
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "employee_id": user.employee_id,
            "role": user.role,
            "device_id": user.device_id
        }
    }
