# routes/dashboard.py - Admin overview stats
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models import Post, Subscriber, Inquiry, Unlock, User
from utils.auth import get_current_admin

router = APIRouter()


@router.get("/overview")
async def overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """One-call snapshot for the admin dashboard."""
    posts_total = (await db.execute(select(func.count()).select_from(Post))).scalar_one()
    posts_published = (
        await db.execute(select(func.count()).select_from(Post).where(Post.is_published == True))
    ).scalar_one()
    total_views = (await db.execute(select(func.coalesce(func.sum(Post.views), 0)))).scalar_one()
    subscribers = (
        await db.execute(select(func.count()).select_from(Subscriber).where(Subscriber.is_active == True))
    ).scalar_one()
    pending = (
        await db.execute(select(func.count()).select_from(Subscriber).where(Subscriber.is_active == False))
    ).scalar_one()
    inquiries = (await db.execute(select(func.count()).select_from(Inquiry))).scalar_one()
    unlocks = (await db.execute(select(func.count()).select_from(Unlock))).scalar_one()
    revenue_cents = (
        await db.execute(
            select(func.coalesce(func.sum(Post.price_cents), 0))
            .select_from(Unlock)
            .join(Post, Unlock.post_id == Post.id)
        )
    ).scalar_one()

    recent_q = await db.execute(select(Inquiry).order_by(Inquiry.created_at.desc()).limit(5))
    recent = [
        {
            "id": r.id, "name": r.name, "email": r.email,
            "project_type": r.project_type, "budget": r.budget,
            "message": r.message, "created_at": r.created_at,
        }
        for r in recent_q.scalars().all()
    ]

    return {
        "posts_total": posts_total,
        "posts_published": posts_published,
        "total_views": total_views,
        "subscribers_active": subscribers,
        "subscribers_pending": pending,
        "inquiries": inquiries,
        "unlocks": unlocks,
        "revenue_cents": revenue_cents,
        "recent_inquiries": recent,
    }