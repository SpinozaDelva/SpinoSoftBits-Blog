# routes/newsletter.py - Newsletter subscribe / unsubscribe
from fastapi import APIRouter, Depends, BackgroundTasks, Query
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from database import get_db
from models import Subscriber, User
from schemas.schemas import SubscriberCreate, SubscriberResponse
from utils.auth import get_current_admin
from utils.email import send_welcome_email

router = APIRouter()


@router.post("/subscribe", response_model=SubscriberResponse, status_code=201)
async def subscribe(
    data: SubscriberCreate,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Public: add an email to the list (idempotent). Sends a welcome email."""
    email = data.email.lower().strip()

    result = await db.execute(select(Subscriber).where(Subscriber.email == email))
    existing = result.scalar_one_or_none()

    if existing:
        # Re-activate a previously unsubscribed address; otherwise no-op.
        if not existing.is_active:
            existing.is_active = True
            await db.commit()
            await db.refresh(existing)
            background.add_task(send_welcome_email, existing.email, existing.name)
        return existing

    sub = Subscriber(
        email=email,
        name=(data.name or None),
        interests=",".join(data.interests or []),
        is_active=True,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    background.add_task(send_welcome_email, sub.email, sub.name)
    return sub


@router.get("/unsubscribe", response_class=HTMLResponse)
async def unsubscribe(email: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Public one-click unsubscribe (linked from emails)."""
    addr = email.lower().strip()
    result = await db.execute(select(Subscriber).where(Subscriber.email == addr))
    sub = result.scalar_one_or_none()
    if sub and sub.is_active:
        sub.is_active = False
        await db.commit()

    return HTMLResponse(
        """
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;color:#333;">
          <h2>You're unsubscribed.</h2>
          <p>You won't receive any more emails. Changed your mind? Just subscribe again.</p>
        </body></html>
        """
    )


# ─── Admin ───────────────────────────────────────────────────────────────────
@router.get("/subscribers", response_model=List[SubscriberResponse])
async def list_subscribers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Admin: see your list (active first, newest first)."""
    result = await db.execute(
        select(Subscriber).order_by(Subscriber.is_active.desc(), Subscriber.subscribed_at.desc())
    )
    return result.scalars().all()


@router.get("/count")
async def subscriber_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Admin: quick active-subscriber count."""
    result = await db.execute(
        select(func.count()).select_from(Subscriber).where(Subscriber.is_active == True)
    )
    return {"active_subscribers": result.scalar_one()}