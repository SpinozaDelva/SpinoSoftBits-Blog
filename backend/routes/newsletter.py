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


# routes/newsletter.py - Newsletter subscribe / unsubscribe / send
import secrets

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
    send_welcome_email, send_confirm_email, send_new_post_email,
    send_custom_email, render_email, API_URL,
)

router = APIRouter()


def _page(title: str, message: str) -> str:
    return f"""
    <html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f4f5f7;margin:0;padding:60px 20px;text-align:center;color:#2b2f36;">
      <div style="max-width:440px;margin:0 auto;background:#fff;border-radius:16px;padding:40px 28px;box-shadow:0 2px 14px rgba(0,0,0,0.06);">
        <h1 style="margin:0 0 12px;font-size:24px;">SpinoSoft<span style="color:#e8b339;">Bits</span></h1>
        <h2 style="margin:0 0 10px;font-size:20px;">{title}</h2>
        <p style="font-size:15px;line-height:1.6;color:#555;margin:0 0 24px;">{message}</p>
        <a href="https://blog.spinosoftbits.com" style="background:#667eea;color:#fff;text-decoration:none;padding:11px 22px;border-radius:9px;font-size:14px;">Go to the blog</a>
      </div>
    </body></html>
    """


@router.post("/subscribe", response_model=SubscriberResponse, status_code=201)
async def subscribe(
    data: SubscriberCreate,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Public: double opt-in. New/pending signups get a confirmation email and
    stay inactive until they click it. Already-confirmed addresses are a no-op."""
    email = data.email.lower().strip()

    result = await db.execute(select(Subscriber).where(Subscriber.email == email))
    existing = result.scalar_one_or_none()

    if existing and existing.is_active:
        return existing  # already confirmed — nothing to do

    token = secrets.token_urlsafe(24)

    if existing:
        # Pending or previously unsubscribed → refresh token, re-send confirm.
        existing.confirm_token = token
        existing.is_active = False
        if data.name:
            existing.name = data.name
        await db.commit()
        await db.refresh(existing)
        background.add_task(send_confirm_email, existing.email, existing.name, token)
        return existing

    sub = Subscriber(
        email=email,
        name=(data.name or None),
        interests=",".join(data.interests or []),
        is_active=False,          # not active until confirmed
        confirm_token=token,
    )
    db.add(sub)
    await db.commit()
    await db.refresh(sub)

    background.add_task(send_confirm_email, sub.email, sub.name, token)
    return sub


@router.get("/confirm", response_class=HTMLResponse)
async def confirm(
    background: BackgroundTasks,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Double opt-in confirmation. Activates the subscriber and sends the welcome."""
    result = await db.execute(select(Subscriber).where(Subscriber.confirm_token == token))
    sub = result.scalar_one_or_none()

    if not sub:
        return HTMLResponse(
            _page("Link expired", "This confirmation link is invalid or was already used. Try subscribing again."),
            status_code=400,
        )

    sub.is_active = True
    sub.confirm_token = None
    await db.commit()

    background.add_task(send_welcome_email, sub.email, sub.name)
    return HTMLResponse(
        _page("You're confirmed! 🎉", "Thanks for confirming — you're officially on the list. A welcome note is on its way.")
    )


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
        cover = post.cover_image if data.include_cover else None
        background.add_task(
            send_new_post_email, recipients, post.title, post.excerpt or "",
            post.slug, cover, post.content or "",
        )
    return {"sent": len(recipients)}