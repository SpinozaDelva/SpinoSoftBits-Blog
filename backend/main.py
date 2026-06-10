# main.py - FastAPI Blog Backend
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from config import settings
from database import engine, Base
from models import User, Post, Tag, Subscriber

# Import routes
from routes import auth, posts

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
    title="SpinozaSoftBits Blog API",
    description="A modern blog API built with Python FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(posts.router, prefix="/api/posts", tags=["Posts"])

# Health check
@app.get("/")
async def root():
    return {
        "status": "healthy",
        "message": "SpinozaSoftBits Blog API",
        "docs": "/docs"
    }

# added a POST Endpoint check. 
@app.route("/api/health", methods=["POST"])
async def health_check():
    return {
        "status ": "OK"
    }

