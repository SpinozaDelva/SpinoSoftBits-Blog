# routes/contact.py - "Work with me" inquiries
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models import Inquiry, User
from schemas.schemas import InquiryCreate
from utils.auth import get_current_admin
from utils.email import send_inquiry_email

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_inquiry(
    data: InquiryCreate,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """Public: receive a 'work with me' inquiry — store it and email the admin."""
    if len(data.message.strip()) < 5:
        raise HTTPException(status_code=422, detail="Please add a short message.")

    inquiry = Inquiry(
        name=data.name.strip(),
        email=data.email.lower().strip(),
        project_type=(data.project_type or None),
        budget=(data.budget or None),
        message=data.message.strip(),
    )
    db.add(inquiry)
    await db.commit()

    background.add_task(
        send_inquiry_email,
        data.name.strip(), data.email, data.message.strip(),
        data.project_type, data.budget,
    )
    return {"ok": True}


@router.get("/inquiries")
async def list_inquiries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Admin: review all inquiries (newest first)."""
    result = await db.execute(select(Inquiry).order_by(Inquiry.created_at.desc()))
    rows = result.scalars().all()
    return [
        {
            "id": r.id, "name": r.name, "email": r.email,
            "project_type": r.project_type, "budget": r.budget,
            "message": r.message, "created_at": r.created_at,
        }
        for r in rows
    ]