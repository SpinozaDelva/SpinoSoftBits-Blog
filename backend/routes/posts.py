# routes/posts.py - Blog Post Routes
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, timezone
import re

from database import get_db
from models import Post, Tag, User, Subscriber
from schemas.schemas import PostCreate, PostUpdate, PostResponse
from utils.auth import get_current_user, get_current_admin
from utils.email import send_new_post_email

router = APIRouter()


def create_slug(title: str) -> str:
    """Create URL-friendly slug from title."""
    slug = title.lower()
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'[^a-z0-9-]', '', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


def calculate_read_time(content: str) -> int:
    """Calculate read time in minutes."""
    words = len(content.split())
    return max(1, round(words / 200))


# ─── Scheduled-drop helpers ──────────────────────────────────────────────────
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _is_locked(post) -> bool:
    """A published post stays locked (teaser only) until its drop_date passes.
    drop_date NULL or in the past = fully live."""
    if not post.drop_date:
        return False
    dd = post.drop_date
    if dd.tzinfo is None:               # treat naive timestamps as UTC
        dd = dd.replace(tzinfo=timezone.utc)
    return dd > _now()


def _teaser(text: Optional[str], max_words: int = 30) -> str:
    """Short snippet for a locked post — enough to tease, not to spoil."""
    if not text:
        return ""
    words = text.split()
    if len(words) <= max_words:
        return text
    return " ".join(words[:max_words]).rstrip(".,;:") + "…"


def _serialize(post, unlocked: bool = False) -> dict:
    """Build the public payload.

    For a locked post we strip `content` entirely and trim the excerpt, so the
    body never leaves the server before the drop. The same applies to a premium
    post unless `unlocked=True` (a valid paid token was presented). We return a
    FRESH dict and never mutate the ORM row, so the request-end commit can't
    write these stripped values back to the database.
    """
    locked = _is_locked(post)
    premium_locked = bool(post.is_premium) and not unlocked
    withhold = locked or premium_locked
    return {
        "id": post.id,
        "slug": post.slug,
        "title": post.title,
        "excerpt": _teaser(post.excerpt) if locked else post.excerpt,
        "content": None if withhold else post.content,
        "cover_image": post.cover_image,
        "read_time": post.read_time,
        "is_published": post.is_published,
        "is_featured": post.is_featured,
        "category": post.category or "tech",
        "is_locked": locked,
        "is_premium": bool(post.is_premium),
        "price_cents": post.price_cents or 0,
        "premium_locked": premium_locked,
        "views": post.views,
        "author": post.author,
        "created_at": post.created_at,
        "published_at": post.published_at,
        "drop_date": post.drop_date,
    }


async def _active_subscriber_emails(db: AsyncSession) -> List[str]:
    """Email addresses of everyone still subscribed."""
    result = await db.execute(
        select(Subscriber.email).where(Subscriber.is_active == True)
    )
    return list(result.scalars().all())


def _admin_serialize(post) -> dict:
    """Admin view — full content always, plus the computed lock state so the
    management UI can show Draft / Scheduled / Published at a glance."""
    return {
        "id": post.id,
        "slug": post.slug,
        "title": post.title,
        "excerpt": post.excerpt,
        "content": post.content,
        "cover_image": post.cover_image,
        "read_time": post.read_time,
        "is_published": post.is_published,
        "is_featured": post.is_featured,
        "is_locked": _is_locked(post),
        "views": post.views,
        "author": post.author,
        "created_at": post.created_at,
        "published_at": post.published_at,
        "drop_date": post.drop_date,
    }


# ─── Public routes ───────────────────────────────────────────────────────────
@router.get("/", response_model=List[PostResponse])
async def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    tag: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get all published posts. Scheduled posts appear as locked teasers."""
    query = select(Post).where(Post.is_published == True).options(
        selectinload(Post.author),
        selectinload(Post.tags)
    ).order_by(Post.published_at.desc())

    if tag:
        query = query.join(Post.tags).where(Tag.slug == tag)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    posts = result.scalars().all()

    return [_serialize(p) for p in posts]


@router.get("/featured", response_model=List[PostResponse])
async def get_featured_posts(
    limit: int = Query(5, ge=1, le=10),
    db: AsyncSession = Depends(get_db)
):
    """Get featured posts (locked ones returned as teasers)."""
    query = select(Post).where(
        Post.is_published == True,
        Post.is_featured == True
    ).options(
        selectinload(Post.author),
        selectinload(Post.tags)
    ).order_by(Post.published_at.desc()).limit(limit)

    result = await db.execute(query)
    posts = result.scalars().all()

    return [_serialize(p) for p in posts]


# ─── Admin read routes (declared before /{slug} so they match cleanly) ───────
@router.get("/admin/list", response_model=List[PostResponse])
async def admin_list_posts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Every post — drafts, scheduled, and published — newest first (admin only)."""
    query = select(Post).options(
        selectinload(Post.author),
        selectinload(Post.tags)
    ).order_by(Post.created_at.desc())

    result = await db.execute(query)
    posts = result.scalars().all()

    return [_admin_serialize(p) for p in posts]


@router.get("/admin/get/{slug}", response_model=PostResponse)
async def admin_get_post(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Fetch one post by slug with full content, any status (admin edit view)."""
    result = await db.execute(
        select(Post).where(Post.slug == slug).options(
            selectinload(Post.author),
            selectinload(Post.tags)
        )
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    return _admin_serialize(post)


@router.get("/{slug}", response_model=PostResponse)
async def get_post(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a single post by slug. A locked post returns its teaser, never the body."""
    query = select(Post).where(
        Post.slug == slug,
        Post.is_published == True
    ).options(
        selectinload(Post.author),
        selectinload(Post.tags)
    )

    result = await db.execute(query)
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Only count a view once the post is actually readable.
    if not _is_locked(post):
        post.views += 1
        await db.commit()

    return _serialize(post)


# ─── Admin routes ────────────────────────────────────────────────────────────
@router.get("/admin/all", response_model=List[PostResponse])
async def list_all_posts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Every post — drafts, scheduled, and published — for the admin manage view.
    Returns full content (the admin is the author/editor). Two path segments
    (/admin/all) so it never collides with the public /{slug} route."""
    query = select(Post).options(
        selectinload(Post.author),
        selectinload(Post.tags)
    ).order_by(Post.created_at.desc())
    result = await db.execute(query)
    posts = result.scalars().all()
    return posts


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a new post (admin only). Pass drop_date to schedule a future drop."""
    slug = create_slug(post_data.title)

    # Check if slug exists
    existing = await db.execute(select(Post).where(Post.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"

    # Create post
    post = Post(
        slug=slug,
        title=post_data.title,
        content=post_data.content,
        excerpt=post_data.excerpt or post_data.content[:200],
        cover_image=post_data.cover_image,
        read_time=calculate_read_time(post_data.content),
        is_featured=post_data.is_featured,
        category=post_data.category or "tech",
        font_style=post_data.font_style or "default",
        is_premium=post_data.is_premium,
        price_cents=post_data.price_cents or 0,
        drop_date=post_data.drop_date,
        author_id=current_user.id
    )

    # Handle tags
    if post_data.tags:
        for tag_name in post_data.tags:
            tag_slug = create_slug(tag_name)
            result = await db.execute(select(Tag).where(Tag.slug == tag_slug))
            tag = result.scalar_one_or_none()

            if not tag:
                tag = Tag(name=tag_name, slug=tag_slug)
                db.add(tag)

            post.tags.append(tag)

    db.add(post)
    await db.commit()
    await db.refresh(post)

    # Reload with relationships
    result = await db.execute(
        select(Post).where(Post.id == post.id).options(
            selectinload(Post.author),
            selectinload(Post.tags)
        )
    )
    post = result.scalar_one()

    return _serialize(post)


@router.put("/{slug}", response_model=PostResponse)
async def update_post(
    slug: str,
    post_data: PostUpdate,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update a post (admin only)."""
    result = await db.execute(select(Post).where(Post.slug == slug))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    was_published = post.is_published  # to detect a draft → live transition

    # Update fields
    if post_data.title is not None:
        post.title = post_data.title
    if post_data.content is not None:
        post.content = post_data.content
        post.read_time = calculate_read_time(post_data.content)
    if post_data.excerpt is not None:
        post.excerpt = post_data.excerpt
    if post_data.cover_image is not None:
        post.cover_image = post_data.cover_image
    if post_data.is_featured is not None:
        post.is_featured = post_data.is_featured
    if post_data.category is not None:
        post.category = post_data.category
    if post_data.font_style is not None:
        post.font_style = post_data.font_style
    if post_data.is_premium is not None:
        post.is_premium = post_data.is_premium
    if post_data.price_cents is not None:
        post.price_cents = post_data.price_cents
    if post_data.is_published is not None:
        post.is_published = post_data.is_published
        if post_data.is_published and not post.published_at:
            post.published_at = datetime.utcnow()
    # Set a scheduled drop, or unlock now by sending a past datetime.
    if post_data.drop_date is not None:
        post.drop_date = post_data.drop_date

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Post).where(Post.id == post.id).options(
            selectinload(Post.author),
            selectinload(Post.tags)
        )
    )
    post = result.scalar_one()

    # If this update just made a readable post go live, email subscribers once.
    if (not was_published) and post.is_published and not _is_locked(post):
        emails = await _active_subscriber_emails(db)
        if emails:
            background.add_task(
                send_new_post_email, emails, post.title, post.excerpt or "", post.slug, post.cover_image
            )

    return _serialize(post)


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Delete a post (admin only)."""
    result = await db.execute(select(Post).where(Post.slug == slug))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    await db.delete(post)
    await db.commit()


@router.post("/{slug}/publish", response_model=PostResponse)
async def publish_post(
    slug: str,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Publish a draft post (admin only). A drop_date still gates the content."""
    result = await db.execute(select(Post).where(Post.slug == slug))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    was_published = post.is_published  # avoid re-notifying on re-publish
    post.is_published = True
    if not post.published_at:
        post.published_at = datetime.utcnow()

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Post).where(Post.id == post.id).options(
            selectinload(Post.author),
            selectinload(Post.tags)
        )
    )
    post = result.scalar_one()

    # Email subscribers once — only if newly published and readable now
    # (a still-locked scheduled post won't notify until it's actually live).
    if (not was_published) and not _is_locked(post):
        emails = await _active_subscriber_emails(db)
        if emails:
            background.add_task(
                send_new_post_email, emails, post.title, post.excerpt or "", post.slug, post.cover_image
            )

    return _serialize(post)mnghb