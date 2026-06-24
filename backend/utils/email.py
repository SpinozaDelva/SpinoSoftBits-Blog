# utils/email.py - Resend email helpers
import os
import re
from typing import Optional, List

import resend

# Read straight from env (matches your Railway variables), so this doesn't
# depend on exact field names in config.py.
resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "hello@spinosoftbits.com")
FROM_NAME = os.getenv("FROM_NAME", "SpinoSoftBits")
SITE_URL = os.getenv("BLOG_URL", "https://blog.spinosoftbits.com").rstrip("/")
API_URL = os.getenv("PUBLIC_API_URL", "https://spinosoftbits-blog-production.up.railway.app/api").rstrip("/")


MAIN_SITE = os.getenv("MAIN_SITE", "https://spinosoftbits.com").rstrip("/")
GITHUB = "https://github.com/SpinozaDelva"
LINKEDIN = "https://www.linkedin.com/in/spinozadelva"
TAGLINE = "Tech, poems & life — from Brooklyn."


def _sender() -> str:
    return f"{FROM_NAME} <{FROM_EMAIL}>"


def _shell(inner: str) -> str:
    """Wrap content in a branded, polished email layout (inline CSS for clients)."""
    return f"""
    <div style="background:#f4f5f7;padding:28px 14px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 14px rgba(0,0,0,0.06);">

        <!-- Header (solid color first = Outlook fallback; gradient for modern clients) -->
        <div style="background-color:#667eea;background-image:linear-gradient(135deg,#667eea 0%,#764ba2 55%,#e8b339 130%);padding:32px 28px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:-0.3px;font-weight:800;">
            SpinoSoft<span style="color:#ffd86b;">Bits</span>
          </h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">{TAGLINE}</p>
        </div>

        <!-- Body -->
        <div style="padding:32px 28px;color:#2b2f36;">
          {inner}
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #eee;padding:22px 28px;text-align:center;background:#fafafa;">
          <p style="margin:0 0 10px;">
            <a href="{GITHUB}" style="color:#667eea;text-decoration:none;font-size:13px;margin:0 8px;">GitHub</a>
            <a href="{LINKEDIN}" style="color:#667eea;text-decoration:none;font-size:13px;margin:0 8px;">LinkedIn</a>
            <a href="{MAIN_SITE}" style="color:#667eea;text-decoration:none;font-size:13px;margin:0 8px;">Hire me</a>
          </p>
          <p style="margin:0;color:#9aa0a6;font-size:12px;">
            Powered by <a href="{MAIN_SITE}" style="color:#9aa0a6;">SpinoSoftBits.com</a> · Brooklyn, NY
          </p>
        </div>

      </div>
    </div>
    """


def send_welcome_email(to_email: str, name: Optional[str] = None) -> None:
    """Best-effort welcome to a new subscriber. Never raises."""
    if not resend.api_key:
        print("[email] RESEND_API_KEY missing — skipping welcome email")
        return
    greeting = f"Hey {name}," if name else "Hey there,"
    unsub = f"{API_URL}/newsletter/unsubscribe?email={to_email}"
    inner = f"""
      <p style="font-size:12px;color:#764ba2;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;font-weight:600;">Welcome aboard</p>
      <h2 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#1a1f29;">You're in. 🎉</h2>

      <p style="font-size:16px;line-height:1.7;color:#3a4150;margin:0 0 16px;">
        {greeting}
      </p>
      <p style="font-size:16px;line-height:1.7;color:#3a4150;margin:0 0 16px;">
        I'm <strong>Spinoza Delva</strong> — a full-stack engineer in Brooklyn and the person
        behind SpinoSoftBits. Thanks for subscribing; it genuinely means a lot.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#3a4150;margin:0 0 16px;">
        Here's what to expect from me: I'll email you when I publish something new —
        <strong>tech write-ups, poems, and notes on health &amp; lifestyle</strong> — plus the
        occasional update on what I'm building. No spam, no daily noise. Just the good stuff,
        when there's good stuff.
      </p>
      <p style="font-size:16px;line-height:1.7;color:#3a4150;margin:0 0 22px;">
        Building something yourself and want a hand? Just hit reply — these come straight to me.
      </p>

      <p style="font-size:15px;line-height:1.6;color:#3a4150;background:#f4f5ff;border-radius:10px;padding:14px 16px;margin:0 0 22px;">
        💡 <strong>One small favor:</strong> add <strong>{FROM_EMAIL}</strong> to your contacts so my
        emails land in your main inbox instead of getting lost in a Promotions tab.
      </p>

      <p style="margin:0 0 6px;">
        <a href="{SITE_URL}" style="background:#667eea;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9px;font-size:15px;font-weight:600;display:inline-block;">Start reading →</a>
      </p>

      <p style="font-size:13px;color:#9aa0a6;margin-top:24px;">
        Changed your mind? No hard feelings — <a href="{unsub}" style="color:#9aa0a6;">unsubscribe anytime</a>.
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


def send_new_post_email(to_emails: List[str], title: str, excerpt: str, slug: str,
                        cover_image: Optional[str] = None, content: Optional[str] = None) -> None:
    """Notify subscribers about a new post. One email per recipient so
    addresses stay private. Best-effort; never raises."""
    if not resend.api_key or not to_emails:
        return
    url = f"{SITE_URL}/post/{slug}"
    cover_html = (
        f'<img src="{cover_image}" alt="" width="524" '
        f'style="width:100%;max-width:524px;border-radius:10px;margin:0 0 20px;display:block;" />'
        if cover_image else ""
    )

    # Lead-in (excerpt) + a real preview of the writing, so there's substance
    # before the call to action.
    lead = excerpt.strip() if excerpt else ""
    preview = _preview_from_content(content or "", limit=460)
    lead_html = (
        f'<p style="font-size:17px;line-height:1.6;color:#2b2f36;margin:0 0 16px;font-style:italic;">'
        f'{_esc_html(lead)}</p>'
        if lead else ""
    )
    if preview:
        preview_html = "".join(
            f'<p style="font-size:16px;line-height:1.75;color:#4a5160;margin:0 0 16px;">{_esc_html(b)}</p>'
            for b in (preview.split("\n\n") if "\n\n" in preview else [preview])
        )
    elif not lead:
        preview_html = (
            '<p style="font-size:16px;line-height:1.75;color:#4a5160;margin:0 0 16px;">'
            'A new piece just went live — give it a read.</p>'
        )
    else:
        preview_html = ""

    for email in to_emails:
        unsub = f"{API_URL}/newsletter/unsubscribe?email={email}"
        inner = f"""
          {cover_html}
          <p style="font-size:12px;color:#764ba2;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;font-weight:600;">Fresh from the blog</p>
          <h2 style="margin:0 0 16px;font-size:25px;line-height:1.25;color:#1a1f29;">{title}</h2>
          {lead_html}
          {preview_html}
          <p style="margin:24px 0 6px;">
            <a href="{url}" style="background:#667eea;color:#fff;text-decoration:none;padding:13px 26px;border-radius:9px;font-size:15px;font-weight:600;display:inline-block;">Read the full post →</a>
          </p>
          <p style="font-size:13px;color:#9aa0a6;margin-top:24px;">
            You're getting this because you subscribed at SpinoSoftBits.
            <a href="{unsub}" style="color:#9aa0a6;">Unsubscribe</a>.
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


# ─── Custom newsletter templates ─────────────────────────────────────────────
def _esc_html(s) -> str:
    return (str(s) if s is not None else "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _paragraphs(text: str) -> str:
    """Turn plain text into paragraphs (double-newline = new paragraph)."""
    blocks = [b.strip() for b in (text or "").split("\n\n") if b.strip()]
    if not blocks:
        blocks = [b.strip() for b in (text or "").split("\n") if b.strip()]
    return "".join(
        f'<p style="font-size:16px;line-height:1.7;color:#333;margin:0 0 16px;">'
        f'{_esc_html(b)}</p>'
        for b in blocks
    )


def _preview_from_content(content: str, limit: int = 420) -> str:
    """Build a clean text preview from post content: strip image lines/tokens,
    keep prose, and trim to a sentence near `limit` chars."""
    if not content:
        return ""
    kept = []
    for ln in content.split("\n"):
        s = ln.strip()
        if s.startswith("[img:"):
            continue
        if re.match(r"^https?://\S+\.(png|jpe?g|gif|webp|avif)(\?\S*)?$", s, re.I):
            continue
        kept.append(ln)
    text = re.sub(r"\n{3,}", "\n\n", "\n".join(kept)).strip()
    if len(text) <= limit:
        return text
    cut = text[:limit]
    end = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "))
    if end > limit * 0.5:
        return cut[: end + 1]
    return cut.rsplit(" ", 1)[0].rstrip() + "…"


def render_email(subject, body, heading=None, cta_text=None, cta_url=None,
                 template="update", unsub_url="", body_html=None):
    """Build a branded HTML email body from simple inputs. If body_html is given
    (admin-authored rich text), it's used directly; otherwise plain `body` is
    escaped and split into paragraphs."""
    accent = "#667eea"
    heading_html = ""
    if heading:
        if template == "announcement":
            heading_html = (
                f'<p style="font-size:13px;color:{accent};text-transform:uppercase;'
                f'letter-spacing:1px;margin:0 0 8px;">Announcement</p>'
                f'<h2 style="margin:0 0 16px;font-size:26px;">{_esc_html(heading)}</h2>'
            )
        else:
            heading_html = f'<h2 style="margin:0 0 16px;font-size:22px;">{_esc_html(heading)}</h2>'

    cta_html = ""
    if cta_text and cta_url:
        cta_html = (
            f'<p style="margin-top:22px;"><a href="{cta_url}" '
            f'style="background:{accent};color:#fff;text-decoration:none;padding:11px 20px;'
            f'border-radius:8px;font-size:14px;">{_esc_html(cta_text)}</a></p>'
        )

    unsub_html = (
        f'<p style="font-size:12px;color:#888;margin-top:28px;">'
        f'<a href="{unsub_url}" style="color:#888;">Unsubscribe</a></p>'
        if unsub_url else ""
    )

    content = body_html if body_html else _paragraphs(body)
    body_wrap = f'<div style="font-size:16px;line-height:1.7;color:#333;">{content}</div>'
    return _shell(heading_html + body_wrap + cta_html + unsub_html)


def send_custom_email(to_email: str, subject: str, html: str) -> None:
    """Send a pre-rendered HTML email. Best-effort; never raises."""
    if not resend.api_key or not to_email:
        return
    try:
        resend.Emails.send({
            "from": _sender(),
            "to": [to_email],
            "subject": subject,
            "html": html,
        })
    except Exception as e:  # noqa: BLE001
        print(f"[email] custom send failed for {to_email}: {e}")


def send_confirm_email(to_email: str, name: Optional[str], token: str) -> None:
    """Double opt-in: ask the subscriber to confirm their email. Best-effort."""
    if not resend.api_key or not to_email:
        return
    greeting = f"Hey {name}," if name else "Hey there,"
    confirm_url = f"{API_URL}/newsletter/confirm?token={token}"
    inner = f"""
      <p style="font-size:12px;color:#764ba2;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;font-weight:600;">One quick step</p>
      <h2 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#1a1f29;">Confirm your subscription</h2>
      <p style="font-size:16px;line-height:1.7;color:#3a4150;margin:0 0 16px;">{greeting}</p>
      <p style="font-size:16px;line-height:1.7;color:#3a4150;margin:0 0 22px;">
        Thanks for signing up for SpinoSoftBits. One click and you're in — I just need to
        confirm it's really your inbox.
      </p>
      <p style="margin:0 0 18px;">
        <a href="{confirm_url}" style="background:#667eea;color:#fff;text-decoration:none;padding:13px 26px;border-radius:9px;font-size:15px;font-weight:600;display:inline-block;">Confirm my email →</a>
      </p>
      <p style="font-size:13px;color:#9aa0a6;margin-top:18px;">
        Didn't sign up? You can ignore this — nothing happens unless you confirm.
      </p>
    """
    try:
        resend.Emails.send({
            "from": _sender(),
            "to": [to_email],
            "subject": "Confirm your subscription — SpinoSoftBits",
            "html": _shell(inner),
        })
    except Exception as e:  # noqa: BLE001
        print(f"[email] confirm send failed for {to_email}: {e}")


def send_inquiry_email(name, email, message, project_type=None, budget=None) -> None:
    """Notify the admin of a new 'work with me' inquiry. Reply-to is the lead's
    address, so a reply goes straight to them. Best-effort; never raises."""
    if not resend.api_key:
        return
    extra = ""
    if project_type:
        extra += f'<p style="font-size:15px;margin:0 0 6px;"><strong>Project:</strong> {_esc_html(project_type)}</p>'
    if budget:
        extra += f'<p style="font-size:15px;margin:0 0 6px;"><strong>Budget:</strong> {_esc_html(budget)}</p>'
    inner = f"""
      <p style="font-size:12px;color:#764ba2;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 10px;font-weight:600;">New inquiry</p>
      <h2 style="margin:0 0 14px;font-size:22px;color:#1a1f29;">{_esc_html(name)} wants to work with you</h2>
      <p style="font-size:15px;margin:0 0 6px;"><strong>Email:</strong> {_esc_html(email)}</p>
      {extra}
      <p style="font-size:15px;margin:16px 0 6px;"><strong>Message:</strong></p>
      {_paragraphs(message)}
      <p style="font-size:13px;color:#9aa0a6;margin-top:20px;">Reply to this email to respond directly.</p>
    """
    try:
        resend.Emails.send({
            "from": _sender(),
            "to": [FROM_EMAIL],
            "reply_to": email,
            "subject": f"New inquiry from {name}",
            "html": _shell(inner),
        })
    except Exception as e:  # noqa: BLE001
        print(f"[email] inquiry send failed: {e}")