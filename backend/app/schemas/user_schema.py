from pydantic import BaseModel
from typing import Optional
from enum import Enum

# Mirroring the SQLAlchemy Enum
class UserRole(str, Enum):
    ADMIN = "Admin"
    SUPERVISOR = "Supervisor"
    FIELD_OFFICER = "Field Officer"
    CLIENT = "Client"

# Shared properties
class UserBase(BaseModel):
    employee_id: str
    mobile_number: str
    role: UserRole = UserRole.FIELD_OFFICER

# Properties required to create a user
class UserCreate(UserBase):
    password: str # In your specific flow, this handles the initial OTP/Auth setup

# Properties required for Mobile/Employee ID login
class UserLogin(BaseModel):
    identifier: str # Can be either employee_id or mobile_number [cite: 46]
    password: str   # Or OTP [cite: 47]
    device_id: str  # Mandatory for the one-user-one-device binding rule [cite: 47]

# Properties to return to the client
class UserResponse(UserBase):
    id: int
    is_active: bool
    device_id: Optional[str] = None

    class Config:
        from_attributes = True # Allows Pydantic to read data directly from SQLAlchemy models