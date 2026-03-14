import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Patrol and Incident Reporting System"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost/patrol_db")
    
    # JWT Security Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    # A standard shift might be 8-12 hours, so we'll set the token to expire in 14 hours
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 14 

settings = Settings()