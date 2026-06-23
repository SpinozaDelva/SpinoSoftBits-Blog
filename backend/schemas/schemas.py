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
    # Writing type: 'tech' | 'poem' | 'essay'.
    category: Optional[str] = 'tech'
    # Pay-to-unlock.
    is_premium: bool = False
    price_cents: int = 0
    # Optional scheduled drop. NULL/omitted = live immediately.
    # A future datetime keeps the post locked (teaser only) until then.
    drop_date: Optional[datetime] = None
    tags: Optional[List[str]] = []

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    cover_image: Optional[str] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None
    category: Optional[str] = None
    is_premium: Optional[bool] = None
    price_cents: Optional[int] = None
    drop_date: Optional[datetime] = None
    tags: Optional[List[str]] = None

class PostResponse(BaseModel):
    id: int
    slug: str
    title: str
    excerpt: Optional[str] = None
    # content is None when the post is locked (scheduled for a future drop).
    content: Optional[str] = None
    cover_image: Optional[str] = None
    read_time: int
    is_published: bool
    is_featured: bool
    category: Optional[str] = 'tech'
    # True while a scheduled post is still before its drop_date.
    is_locked: bool = False
    # Pay-to-unlock state for the reader.
    is_premium: bool = False
    price_cents: int = 0
    # True when premium content is being withheld (teaser only) in this response.
    premium_locked: bool = False
    views: int
    author: UserResponse
    created_at: datetime
    published_at: Optional[datetime] = None
    drop_date: Optional[datetime] = None

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

# ============ Category Schemas ============
class CategoryCreate(BaseModel):
    name: str
    slug: Optional[str] = None          # auto-generated from name if omitted
    color_primary: str = "#E8B339"
    color_secondary: str = "#FFFFFF"
    serif: bool = False
    position: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color_primary: Optional[str] = None
    color_secondary: Optional[str] = None
    serif: Optional[bool] = None
    position: Optional[int] = None

class CategoryResponse(BaseModel):
    id: int
    slug: str
    name: str
    color_primary: str
    color_secondary: str
    serif: bool
    position: int

    class Config:
        from_attributes = True

# ============ Unlock / Checkout Schemas ============
class CheckoutRequest(BaseModel):
    slug: str

class CheckoutResponse(BaseModel):
    url: str

class VerifyRequest(BaseModel):
    slug: str
    token: str

class ConfirmRequest(BaseModel):
    session_id: str

class UnlockResult(BaseModel):
    token: str
    post: PostResponse