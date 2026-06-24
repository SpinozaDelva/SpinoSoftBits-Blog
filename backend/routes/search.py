# routes/search.py - Public post search + pagination (archive)
import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from database import get_db
from models import Post, Category

router = APIRouter()


def _card(post, color: str | None) -> dict:
    """Lightweight listing card. No body content (keeps payload small and never
    leaks premium content). Built locally so this module imports no other route."""
    return {
        "id": post.id,
        "slug": post.slug,
        "title": post.title,
        "excerpt": post.excerpt,
        "cover_image": post.cover_image,
        "category": post.category or "tech",
        "category_color": color or "#9aa0a6",
        "read_time": post.read_time,
        "is_premium": bool(post.is_premium),
        "created_at": post.created_at,
        "drop_date": post.drop_date,
    }


@router.get("/posts")
async def search_posts(
    q: str = Query("", description="Search text (title, excerpt, body)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(9, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Search published posts by title/excerpt/content, paginated."""
    filters = [Post.is_published == True]
    term = (q or "").strip()
    if term:
        like = f"%{term}%"
        filters.append(or_(
            Post.title.ilike(like),
            Post.excerpt.ilike(like),
            Post.content.ilike(like),
        ))

    total = (await db.execute(
        select(func.count()).select_from(Post).where(*filters)
    )).scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(
        select(Post).where(*filters)
        .order_by(Post.created_at.desc())
        .offset(offset).limit(page_size)
    )
    posts = result.scalars().all()

    # Map category slug -> color so we can tint each label like the home cards.
    colors: dict[str, str] = {}
    cat_rows = await db.execute(select(Category.slug, Category.color_primary))
    for slug, color in cat_rows.all():
        colors[slug] = color

    items = [_card(p, colors.get(p.category or "tech")) for p in posts]

    pages = max(1, math.ceil(total / page_size)) if total else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }