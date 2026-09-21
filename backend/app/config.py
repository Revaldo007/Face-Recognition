import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@localhost:5432/attendance_db",
    )
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]

    # Face recognition settings
    FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.363"))  # min cosine similarity
    FACE_DETECT_SCORE = 0.8          # YuNet confidence for a detection
    MIN_FACE_SIZE = 60               # smallest accepted face width (pixels, after resize)
    MIN_BRIGHTNESS = 40              # mean gray level below this = too dark
    MIN_SHARPNESS = 15               # Laplacian variance below this = blurry
    MAX_IMAGE_WIDTH = 640            # frames are resized to this width before detection
    MODEL_DIR = BASE_DIR / "app" / "face_models"


settings = Settings()
