from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from .config import settings

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Creates a JWT token containing the user's identifying data.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Encode the JWT using the secret key and HS256 algorithm
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt