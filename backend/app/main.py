from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers all tables)
from app.config import settings
from app.database import Base, engine
from app.routers import attendance, auth, courses, departments, face, faculty, reports, students, subjects
from app.services.face_detection import ensure_models


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)   # create tables if they do not exist
    try:
        ensure_models()                      # download the face models on first run
    except Exception as exc:
        print(f"WARNING: face models not ready: {exc}")
    yield


app = FastAPI(title="Facial Recognition Attendance System", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth, students, faculty, departments, courses, subjects, face, attendance, reports):
    app.include_router(r.router)


@app.get("/", tags=["Health"])
def root():
    return {"message": "Facial Recognition Attendance API is running", "docs": "/docs"}
