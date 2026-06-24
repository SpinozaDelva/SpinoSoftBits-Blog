# routes/uploads.py - Image upload to Supabase Storage (admin only)
import os
import uuid

import httpx
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from models import User
from utils.auth import get_current_admin

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
BUCKET = os.getenv("SUPABASE_BUCKET", "post-images")

ALLOWED = {"image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"}
MAX_BYTES = 8 * 1024 * 1024  # 8 MB


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin),
):
    """Upload an image to Supabase Storage and return its public URL."""
    if not SUPABASE_URL or not SERVICE_KEY:
        raise HTTPException(status_code=503, detail="Image uploads are not configured.")
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only image files are allowed.")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 8MB).")

    ext = (file.filename or "img").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "gif", "webp", "avif"):
        ext = "png"
    key = f"{uuid.uuid4().hex}.{ext}"

    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{key}"
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "apikey": SERVICE_KEY,
        "Content-Type": file.content_type,
        "x-upsert": "true",
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(upload_url, content=data, headers=headers)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Upload error: {e}")

    if r.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail=f"Upload failed: {r.text[:200]}")

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{key}"
    return {"url": public_url}