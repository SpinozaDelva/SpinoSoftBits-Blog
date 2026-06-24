# models/models.py - Database Models
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Association table for post tags (many-to-many)
post_tags = Table(
    'post_tags',
    Base.metadata,
    Column('post_id', Integer, ForeignKey('posts.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    posts = relationship("Post", back_populates="author")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    excerpt = Column(Text)
    content = Column(Text, nullable=False)
    cover_image = Column(String(500))
    read_time = Column(Integer, default=5)
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    share_cover = Column(Boolean, nullable=False, default=True, server_default="true")
    font_style = Column(String, nullable=False, default="default", server_default="default")
    # Pay-to-unlock: when True, public API returns only a teaser; full content
    # requires a valid unlock token. price_cents is the one-time price (e.g. 300 = $3).
    is_premium = Column(Boolean, default=False)
    price_cents = Column(Integer, default=0)
    # Writing type — references a Category.slug (managed in the categories table).
    category = Column(String(40), default='tech')
    views = Column(Integer, default=0)
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    published_at = Column(DateTime(timezone=True))
    # Scheduled drop: NULL = live immediately; a future datetime = locked
    # (teaser only) until that moment, then auto-unlocks. Enforced server-side.
    drop_date = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    author = relationship("User", back_populates="posts")
    tags = relationship("Tag", secondary=post_tags, back_populates="posts")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    slug = Column(String(50), unique=True, nullable=False)

    posts = relationship("Post", secondary=post_tags, back_populates="tags")

class Subscriber(Base):
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255))
    interests = Column(String(500))
    is_active = Column(Boolean, default=True)
    # Set on signup; cleared once the email is confirmed (double opt-in).
    confirm_token = Column(String(64), nullable=True)
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(40), unique=True, index=True, nullable=False)
    name = Column(String(80), nullable=False)
    # Two-color combo that drives the theme (primary = accent, secondary = blend).
    color_primary = Column(String(9), nullable=False, default="#E8B339")
    color_secondary = Column(String(9), nullable=False, default="#FFFFFF")
    # Use a serif display font for this category (e.g. Poems).
    serif = Column(Boolean, nullable=False, default=False)
    # Sort order in the tab bar / pickers.
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Unlock(Base):
    """A paid unlock for a premium post. The token is the permanent key
    (stored in the buyer's browser + emailed to them)."""
    __tablename__ = "unlocks"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), index=True, nullable=False)
    email = Column(String(255), index=True)
    token = Column(String(64), unique=True, index=True, nullable=False)
    stripe_session_id = Column(String(255), unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Inquiry(Base):
    """A 'work with me' lead from the contact form."""
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    project_type = Column(String(80))
    budget = Column(String(80))
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())