from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.routers.learning_sessions import router as learning_sessions_router
from app.routers.children import router as children_router
from app.routers.users import router as users_router
from app.routers.activities import router as activities_router
from app.routers.activity_contents import router as activity_contents_router
from app.routers.content_variants import router as content_variants_router
from app.routers.learning_objects import router as learning_objects_router
from app.routers.activity_attempts import router as activity_attempts_router
from app.routers.learning_progress import router as learning_progress_router
from app.routers.content_sources import router as content_sources_router
from app.routers.topics import router as topics_router
from app.routers.lessons import router as lessons_router
from app.routers.languages import router as languages_router
from app.routers.storyboards import router as storyboards_router

from app.database import engine


app = FastAPI(
    title="ECCE eTools API",
    description="Backend API for ECCE eTools",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(children_router)
app.include_router(users_router)
app.include_router(learning_sessions_router)
app.include_router(activities_router)
app.include_router(activity_contents_router)
app.include_router(content_variants_router)
app.include_router(learning_objects_router)
app.include_router(activity_attempts_router)
app.include_router(learning_progress_router)
app.include_router(content_sources_router)
app.include_router(topics_router)
app.include_router(lessons_router)
app.include_router(languages_router)
app.include_router(storyboards_router)

@app.get("/")
def root():
    return {
        "message": "ECCE eTools API is running",
        "version": "0.1.0",
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }