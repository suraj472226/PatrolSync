from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from ..models.user import User
from ..schemas.user_schema import UserLogin

def authenticate_user(db: Session, login_data: UserLogin):
    # 1. Find user by either employee_id or mobile_number 
    user = db.query(User).filter(
        (User.employee_id == login_data.identifier) | 
        (User.mobile_number == login_data.identifier)
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Credentials"
        )

    # 2. Verify OTP (Placeholder logic - replace with actual OTP verification) 
    if login_data.password != "123456": # Mock OTP for testing
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP"
        )

    # 3. Device Binding Logic (one user - one device)
    # Admins and Supervisors don't need device binding - they can login from anywhere
    if user.role.value in ["Admin", "Supervisor"]:
        # Don't enforce device binding for admins/supervisors
        # Leave device_id as NULL to avoid unique constraint conflicts
        pass
    else:
        # Strict binding for Field Officers and Clients
        if user.device_id:
            # If a device is already bound, it MUST match the incoming device_id
            if user.device_id != login_data.device_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is bound to another device. Please contact Admin."
                )
        else:
            # First-time login: bind the device
            user.device_id = login_data.device_id
            db.commit()
            db.refresh(user)

    return user