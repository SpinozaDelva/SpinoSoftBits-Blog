# utils/email.py - Resend email helpers
import os
from typing import Optional, List

import resend

# Read straight from env (matches your Railway variables), so this doesn't
# depend on exact field names in config.py.
resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "hello@spinosoftbits.com")
FROM_NAME = os.getenv("FROM_NAME", "SpinoSoftBits")
SITE_URL = os.getenv("BLOG_URL", "https://blog.spinosoftbits.com").rstrip("/")
API_URL = os.getenv("PUBLIC_API_URL", "https://spinosoftbits-blog-production.up.railway.app/api").rstrip("/")


def _sender() -> str:
    return f"{FROM_NAME} <{FROM_EMAIL}>"


def _shell(inner: str) -> str:
    """Wrap content in a simple branded layout."""
    return f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a202c;">
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:24px;border-radius:14px 14px 0 0;">
        <h1 style="margin:0;color:#fff;font-size:20px;">SpinoSoftBits</h1>
      </div>
      <div style="border:1px solid #eee;border-top:none;border-radius:0 0 14px 14px;padding:28px 24px;">
        {inner}
      </div>
    </div>
    """


def send_welcome_email(to_email: str, name: Optional[str] = None) -> None:
    """Best-effort welcome to a new subscriber. Never raises."""
    if not resend.api_key:
        print("[email] RESEND_API_KEY missing — skipping welcome email")
        return
    greeting = f"Hi {name}," if name else "Hi there,"
    unsub = f"{API_URL}/newsletter/unsubscribe?email={to_email}"
    inner = f"""
      <p style="font-size:16px;">{greeting}</p>
      <p style="font-size:16px;line-height:1.6;">
        Thanks for subscribing. You'll get new posts on tech, poems, and
        health &amp; lifestyle — straight to your inbox, no spam.
      </p>
      <p style="font-size:16px;line-height:1.6;">
        Building something and want a hand? Just reply to this email.
      </p>
      <p style="margin-top:24px;">
        <a href="{SITE_URL}" style="background:#667eea;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">Read the blog</a>
      </p>
      <p style="font-size:12px;color:#888;margin-top:28px;">
        Don't want these? <a href="{unsub}" style="color:#888;">Unsubscribe</a>.
      </p>
    """
    try:
        resend.Emails.send({
            "from": _sender(),
            "to": [to_email],
            "subject": "You're in — SpinoSoftBits",
            "html": _shell(inner),
        })
    except Exception as e:  # noqa: BLE001 - best-effort, log and move on
        print(f"[email] welcome send failed for {to_email}: {e}")


def send_new_post_email(to_emails: List[str], title: str, excerpt: str, slug: str) -> None:
    """Notify subscribers about a new post. One email per recipient so
    addresses stay private. Best-effort; never raises."""
    if not resend.api_key or not to_emails:
        return
    url = f"{SITE_URL}/post/{slug}"
    for email in to_emails:
        unsub = f"{API_URL}/newsletter/unsubscribe?email={email}"
        inner = f"""
          <p style="font-size:13px;color:#764ba2;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">New post</p>
          <h2 style="margin:0 0 12px;font-size:22px;">{title}</h2>
          <p style="font-size:16px;line-height:1.6;color:#444;">{excerpt or ''}</p>
          <p style="margin-top:22px;">
            <a href="{url}" style="background:#667eea;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">Read it</a>
          </p>
          <p style="font-size:12px;color:#888;margin-top:28px;">
            <a href="{unsub}" style="color:#888;">Unsubscribe</a>
          </p>
        """
        try:
            resend.Emails.send({
                "from": _sender(),
                "to": [email],
                "subject": f"New post: {title}",
                "html": _shell(inner),
            })
        except Exception as e:  # noqa: BLE001
            print(f"[email] new-post send failed for {email}: {e}")


def send_unlock_email(to_email: str, title: str, slug: str, token: str) -> None:
    """Email a buyer their permanent unlock link after a successful purchase.
    Best-effort; never raises."""
    if not resend.api_key or not to_email:
        return
    link = f"{SITE_URL}/post/{slug}?key={token}"
    inner = f"""
      <p style="font-size:13px;color:#764ba2;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Unlocked ✓</p>
      <h2 style="margin:0 0 12px;font-size:22px;">{title}</h2>
      <p style="font-size:16px;line-height:1.6;color:#444;">
        Thanks for your purchase! Your access is saved on this device — and this
        link will unlock the full post on any device, anytime. Keep this email.
      </p>
      <p style="margin-top:22px;">
        <a href="{link}" style="background:#667eea;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;">Read the full post</a>
      </p>
      <p style="font-size:12px;color:#888;margin-top:24px;word-break:break-all;">
        Or paste this link: {link}
      </p>
    """
    try:
        resend.Emails.send({
            "from": _sender(),
            "to": [to_email],
            "subject": f"Your unlock link — {title}",
            "html": _shell(inner),
        })
    except Exception as e:  # noqa: BLE001
        print(f"[email] unlock send failed for {to_email}: {e}")