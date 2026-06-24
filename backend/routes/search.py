# routes/search.py - Public post search + pagination (archive)
import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from database import get_db
from models import Post, Category

router = APIRouter()


def _card(post, color: str | None) -> dict:
    """Listing card with the fields the shared PostCard renders. No body content
    (keeps payload small and never leaks premium content)."""
    author = None
    if post.author is not None:
        author = {
            "full_name": getattr(post.author, "full_name", None),
            "username": getattr(post.author, "username", None),
        }
    return {
        "id": post.id,
        "slug": post.slug,
        "title": post.title,
        "excerpt": post.excerpt,
        "cover_image": post.cover_image,
        "category": post.category or "tech",
        "category_color": color or "#5AA9E6",
        "read_time": post.read_time,
        "views": post.views or 0,
        "is_featured": bool(post.is_featured),
        "is_premium": bool(post.is_premium),
        "author": author,
        "created_at": post.created_at,
        "drop_date": post.drop_date,
    }


@router.get("/posts")
async def search_posts(
    q: str = Query("", description="Search text (title, excerpt, body)"),
    category: str = Query("", description="Filter by category slug ('' or 'all' = every category)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(9, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Search published posts by title/excerpt/content, optional category, paginated."""
    filters = [Post.is_published == True]
    term = (q or "").strip()
    if term:
        like = f"%{term}%"
        filters.append(or_(
            Post.title.ilike(like),
            Post.excerpt.ilike(like),
            Post.content.ilike(like),
        ))
    cat = (category or "").strip()
    if cat and cat != "all":
        filters.append(Post.category == cat)

    total = (await db.execute(
        select(func.count()).select_from(Post).where(*filters)
    )).scalar_one()

    offset = (page - 1) * page_size
    result = await db.execute(
        select(Post).where(*filters)
        .options(selectinload(Post.author))
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