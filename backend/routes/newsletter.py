# routes/newsletter.py - Newsletter subscribe / unsubscribe / send
from fastapi import APIRouter, Depends, BackgroundTasks, Query, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from database import get_db
from models import Subscriber, User, Post
from schemas.schemas import (
    SubscriberCreate, SubscriberResponse, BroadcastRequest, SendPostRequest,
)
from utils.auth import get_current_admin
from utils.email import (
    send_welcome_email, send_new_post_email, send_custom_email, render_email, API_URL,
)

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


# ─── Admin: send to subscribers ──────────────────────────────────────────────
async def _recipients(db: AsyncSession, emails):
    """Resolve the recipient list to active subscribers. If `emails` is given,
    intersect with active subscribers (so you can't send to arbitrary addresses)."""
    result = await db.execute(select(Subscriber.email).where(Subscriber.is_active == True))
    active = set(result.scalars().all())
    if emails:
        chosen = {e.lower().strip() for e in emails}
        return [e for e in active if e in chosen]
    return list(active)


@router.post("/broadcast")
async def broadcast(
    data: BroadcastRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Send a custom email to all active subscribers, or a selected subset."""
    recipients = await _recipients(db, data.emails)
    for email in recipients:
        unsub = f"{API_URL}/newsletter/unsubscribe?email={email}"
        html = render_email(
            data.subject, data.body,
            heading=data.heading, cta_text=data.cta_text, cta_url=data.cta_url,
            template=(data.template or "update"), unsub_url=unsub, body_html=data.body_html,
        )
        background.add_task(send_custom_email, email, data.subject, html)
    return {"sent": len(recipients)}


@router.post("/send-post")
async def send_post(
    data: SendPostRequest,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Email a specific published post to all active subscribers or a subset."""
    result = await db.execute(select(Post).where(Post.slug == data.slug))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    recipients = await _recipients(db, data.emails)
    if recipients:
        background.add_task(
            send_new_post_email, recipients, post.title, post.excerpt or "", post.slug, post.cover_image
        )
    return {"sent": len(recipients)}