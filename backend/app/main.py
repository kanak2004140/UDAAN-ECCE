from fastapi import FastAPI
from sqlalchemy import text

from app.database import engine

from app.database import Base, engine
from app.models import User, Child, Language

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ECCE eTools API",
    description="Backend API for ECCE eTools",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "message": "ECCE eTools API is running",
        "version": "0.1.0"
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }