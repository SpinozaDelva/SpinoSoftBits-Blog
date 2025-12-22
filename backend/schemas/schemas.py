# schemas/schemas.py - Pydantic Schemas
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ============ User Schemas ============
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    is_admin: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============ Token Schemas ============
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ============ Post Schemas ============
class PostCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    is_featured: bool = False
    tags: Optional[List[str]] = []

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None
    tags: Optional[List[str]] = None

class PostResponse(BaseModel):
    id: int
    slug: str
    title: str
    excerpt: Optional[str] = None
    content: str
    cover_image: Optional[str] = None
    read_time: int
    is_published: bool
    is_featured: bool
    views: int
    author: UserResponse
    created_at: datetime
    published_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ============ Subscriber Schemas ============
class SubscriberCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    interests: Optional[List[str]] = []

class SubscriberResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    is_active: bool
    subscribed_at: datetime
    
    class Config:
        from_attributes = True