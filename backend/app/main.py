from fastapi import FastAPI

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
    return {
        "status": "healthy"
    }