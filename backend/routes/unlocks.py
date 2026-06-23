# routes/unlocks.py - Pay-to-unlock for premium posts (no login required)
import os
import secrets

import stripe
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import Post, Unlock
from schemas.schemas import (
    CheckoutRequest, CheckoutResponse,
    VerifyRequest, ConfirmRequest, UnlockResult,
)
from utils.email import send_unlock_email

# Import the same serializer the post routes use, so unlocked payloads match.
from routes.posts import _serialize

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
SITE_URL = os.getenv("BLOG_URL", "https://blog.spinosoftbits.com").rstrip("/")


async def _post_with_rels(db: AsyncSession, **where):
    field, value = next(iter(where.items()))
    query = select(Post).options(
        selectinload(Post.author), selectinload(Post.tags)
    ).where(getattr(Post, field) == value)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def _get_or_create_unlock(db: AsyncSession, post_id: int, session_id: str, email: str | None):
    """Idempotent: one unlock per Stripe session. Returns (unlock, created)."""
    result = await db.execute(select(Unlock).where(Unlock.stripe_session_id == session_id))
    existing = result.scalar_one_or_none()
    if existing:
        return existing, False
    unlock = Unlock(
        post_id=post_id,
        email=email,
        token=secrets.token_urlsafe(24),
        stripe_session_id=session_id,
    )
    db.add(unlock)
    await db.commit()
    await db.refresh(unlock)
    return unlock, True


# ─── Checkout ────────────────────────────────────────────────────────────────
@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(data: CheckoutRequest, db: AsyncSession = Depends(get_db)):
    """Create a Stripe Checkout session for a premium post."""
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Payments are not configured.")

    post = await _post_with_rels(db, slug=data.slug)
    if not post or not post.is_published:
        raise HTTPException(status_code=404, detail="Post not found")
    if not post.is_premium or (post.price_cents or 0) <= 0:
        raise HTTPException(status_code=400, detail="This post isn't for sale.")

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": post.title},
                    "unit_amount": post.price_cents,
                },
                "quantity": 1,
            }],
            success_url=f"{SITE_URL}/post/{post.slug}?unlocked={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{SITE_URL}/post/{post.slug}",
            metadata={"post_id": str(post.id), "slug": post.slug},
        )
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Stripe error: {e}")

    return {"url": session.url}


# ─── Confirm (after the success redirect) ────────────────────────────────────
@router.post("/confirm", response_model=UnlockResult)
async def confirm(data: ConfirmRequest, db: AsyncSession = Depends(get_db)):
    """Verify a Checkout session with Stripe and return the unlock token + full
    post. Works even if the webhook hasn't fired yet (idempotent)."""
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Payments are not configured.")
    try:
        session = stripe.checkout.Session.retrieve(data.session_id)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Could not verify session: {e}")

    if session.get("payment_status") != "paid":
        raise HTTPException(status_code=402, detail="Payment not completed.")

    post_id = int((session.get("metadata") or {}).get("post_id", 0))
    post = await _post_with_rels(db, id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    email = (session.get("customer_details") or {}).get("email")
    unlock, created = await _get_or_create_unlock(db, post_id, session.id, email)

    if created and email:
        send_unlock_email(email, post.title, post.slug, unlock.token)

    return {"token": unlock.token, "post": _serialize(post, unlocked=True)}


# ─── Verify (returning visitor / emailed link) ───────────────────────────────
@router.post("/verify", response_model=UnlockResult)
async def verify(data: VerifyRequest, db: AsyncSession = Depends(get_db)):
    """Exchange a stored/emailed token for the full post."""
    post = await _post_with_rels(db, slug=data.slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    result = await db.execute(
        select(Unlock).where(Unlock.token == data.token, Unlock.post_id == post.id)
    )
    unlock = result.scalar_one_or_none()
    if not unlock:
        raise HTTPException(status_code=403, detail="Invalid unlock token.")

    return {"token": unlock.token, "post": _serialize(post, unlocked=True)}


# ─── Stripe webhook ──────────────────────────────────────────────────────────
@router.post("/webhook")
async def webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Stripe calls this on payment events. Records the unlock + emails the link.
    Confirmed independently of the browser redirect."""
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    if not WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured.")
    try:
        event = stripe.Webhook.construct_event(payload, sig, WEBHOOK_SECRET)
    except Exception as e:  # noqa: BLE001 - bad signature or parse error
        raise HTTPException(status_code=400, detail=f"Webhook error: {e}")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        post_id = int((session.get("metadata") or {}).get("post_id", 0))
        slug = (session.get("metadata") or {}).get("slug", "")
        email = (session.get("customer_details") or {}).get("email")
        if post_id:
            unlock, created = await _get_or_create_unlock(db, post_id, session["id"], email)
            if created and email:
                post = await _post_with_rels(db, id=post_id)
                title = post.title if post else "your post"
                send_unlock_email(email, title, slug, unlock.token)

    return {"received": True}