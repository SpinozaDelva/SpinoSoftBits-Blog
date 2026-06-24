# main.py - FastAPI Blog Backend
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import settings
from database import engine, Base
from models import User, Post, Tag, Subscriber  # noqa: F401  (imported so tables register)
from routes import auth, posts, newsletter
# Import routes
from routes import auth, posts
from routes import auth, posts, newsletter, categories
from routes import auth, posts, newsletter, categories, unlocks
from routes import auth, posts, newsletter, categories, unlocks, dashboard  
from routes import auth, posts, newsletter, categories, unlocks, dashboard, search

# Create database tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database connected & tables created!")
    yield
    await engine.dispose()
    print("👋 Database connection closed")


# Initialize FastAPI app
app = FastAPI(
    title="SpinoSoftBits Blog API",
    description="A modern blog API built with Python FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(posts.router, prefix="/api/posts", tags=["Posts"])
app.include_router(newsletter.router, prefix="/api/newsletter", tags=["Newsletter"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(unlocks.router, prefix="/api/unlocks", tags=["Unlocks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
# Health check (root)
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "message": "SpinoSoftBits Blog API",
        "docs": "/docs",
    }


# Lightweight health endpoint for uptime checks / Railway
@app.get("/api/health")
async def health_check():
    return {"status": "OK"}