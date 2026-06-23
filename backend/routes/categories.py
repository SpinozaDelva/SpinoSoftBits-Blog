# routes/categories.py - Manage writing categories (data-driven themes)
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from models import Category, User
from schemas.schemas import CategoryCreate, CategoryUpdate, CategoryResponse
from utils.auth import get_current_admin

router = APIRouter()


def _slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return s or "category"


# ─── Public ──────────────────────────────────────────────────────────────────
@router.get("/", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """All categories, in display order. Public — drives the blog theming."""
    result = await db.execute(
        select(Category).order_by(Category.position.asc(), Category.id.asc())
    )
    return result.scalars().all()


# ─── Admin ───────────────────────────────────────────────────────────────────
@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Create a category. Slug is derived from the name unless supplied."""
    slug = _slugify(data.slug or data.name)

    existing = await db.execute(select(Category).where(Category.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A category with slug '{slug}' already exists.",
        )

    category = Category(
        slug=slug,
        name=data.name,
        color_primary=data.color_primary,
        color_secondary=data.color_secondary,
        serif=data.serif,
        position=data.position,
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/{slug}", response_model=CategoryResponse)
async def update_category(
    slug: str,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Edit a category's name, colors, font, or order. (Slug stays fixed so
    existing posts keep pointing at it.)"""
    result = await db.execute(select(Category).where(Category.slug == slug))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if data.name is not None:
        category.name = data.name
    if data.color_primary is not None:
        category.color_primary = data.color_primary
    if data.color_secondary is not None:
        category.color_secondary = data.color_secondary
    if data.serif is not None:
        category.serif = data.serif
    if data.position is not None:
        category.position = data.position

    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin),
):
    """Delete a category. Posts that used it keep their slug string and simply
    fall back to a default look until reassigned."""
    result = await db.execute(select(Category).where(Category.slug == slug))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    await db.delete(category)
    await db.commit()