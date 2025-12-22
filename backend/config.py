# config.py - Environment Configuration
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = ""
    
    # Authentication
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://blog.spinozasoftbits.com"
    ]
    
    # SendGrid
    SENDGRID_API_KEY: str = ""
    FROM_EMAIL: str = ""
    FROM_NAME: str = "SpinozaSoftBits Blog"
    
    class Config:
        env_file = ".env"

settings = Settings()