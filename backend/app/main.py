"""
StatWise — AI-Powered Competency & Learning Intelligence Platform
FastAPI backend application entry point.
"""
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import create_tables
from app.seed import seed_all

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s — %(name)s — %(levelname)s — %(message)s",
)
logger = logging.getLogger("statwise")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed data on startup."""
    logger.info("🚀 StatWise backend starting up...")
    await create_tables()
    await seed_all()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"📁 Upload directory ready: {settings.UPLOAD_DIR}")
    if settings.LLM_API_KEY and settings.LLM_API_KEY != "your-gemini-api-key-here":
        logger.info("🤖 Google Gemini AI: Configured")
    else:
        logger.info("🤖 Google Gemini AI: Not configured — using deterministic mock responses")
    logger.info("✅ StatWise ready at http://localhost:8000")
    yield
    logger.info("👋 StatWise shutting down...")


app = FastAPI(
    title="StatWise API",
    description=(
        "AI-Powered Competency & Learning Intelligence Platform "
        "for India's Official Statistical System.\n\n"
        "**Prototype/Hackathon build** — iGOT and NSSTA integrations are mocked."
    ),
    version="1.0.0-prototype",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads (for any uploaded files served back)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ─── ROUTERS ────────────────────────────────────────────────────────────────
from app.routers import auth, users, competencies, assessments, courses, materials, analytics, chat

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(competencies.router)
app.include_router(assessments.router)
app.include_router(courses.router)
app.include_router(materials.router)
app.include_router(analytics.router)
app.include_router(chat.router)


@app.get("/health", tags=["health"])
async def health_check():
    return {
        "status": "ok",
        "service": "StatWise API",
        "version": "1.0.0-prototype",
        "ai_configured": bool(settings.LLM_API_KEY and settings.LLM_API_KEY != "your-gemini-api-key-here"),
        "igot_integration": "Mock (Prototype)",
        "nssta_integration": "Mock (Prototype)",
    }


@app.get("/", tags=["root"])
async def root():
    return {
        "message": "StatWise API — Bridge the Skill Gap. Build a Future-Ready Statistical Workforce.",
        "docs": "/api/docs",
        "health": "/health",
    }
