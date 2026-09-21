"""Downloads the two OpenCV face models (YuNet detector + SFace recognizer). Run: python download_models.py"""
from app.services.face_detection import ensure_models

if __name__ == "__main__":
    ensure_models()
    print("Face models are ready.")
