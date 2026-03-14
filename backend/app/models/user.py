from sqlalchemy import Column, Integer, String, Boolean, Enum
import enum
from ..database.connection import Base

class UserRole(str, enum.Enum):
    ADMIN = "Admin" # [cite: 42]
    SUPERVISOR = "Supervisor" # [cite: 40]
    FIELD_OFFICER = "Field Officer" # [cite: 39]
    CLIENT = "Client" # [cite: 41]

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True, nullable=False) # 
    mobile_number = Column(String(15), unique=True, index=True, nullable=False) # 
    hashed_password = Column(String(255), nullable=False) # Placeholder for OTP/Auth logic
    
    role = Column(Enum(UserRole), default=UserRole.FIELD_OFFICER, nullable=False)
    
    # Device binding (one user - one device) 
    device_id = Column(String(255), unique=True, nullable=True) 
    
    is_active = Column(Boolean, default=True)