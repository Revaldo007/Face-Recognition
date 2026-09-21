"""Face embeddings (OpenCV SFace) and matching."""
import numpy as np

from app.config import settings
from app.services.face_detection import engine


def get_embedding(img: np.ndarray, face: np.ndarray) -> np.ndarray:
    """Face -> 128 numbers that describe it (unit length)."""
    return engine.embed(img, face)


def average_embeddings(embeddings: list[np.ndarray]) -> np.ndarray:
    mean = np.mean(np.stack(embeddings), axis=0)
    return (mean / (np.linalg.norm(mean) + 1e-9)).astype(np.float32)


def embedding_to_bytes(vec: np.ndarray) -> bytes:
    return np.asarray(vec, dtype=np.float32).tobytes()


def embedding_from_bytes(data: bytes) -> np.ndarray:
    return np.frombuffer(data, dtype=np.float32)


def best_match(query: np.ndarray, gallery: dict[int, np.ndarray]) -> tuple[int | None, float | None]:
    """
    Compare one face with all registered faces.
    Similarity = cosine similarity (1.0 = identical). distance = 1 - similarity.
    Returns (student_db_id, distance). student_db_id is None when even the best
    match is below the configured threshold -> "Student Not Recognized".
    """
    if not gallery:
        return None, None
    ids = list(gallery.keys())
    matrix = np.stack([gallery[i] for i in ids])
    similarities = matrix @ query
    best = int(np.argmax(similarities))
    similarity = float(similarities[best])
    distance = 1.0 - similarity
    if similarity >= settings.FACE_MATCH_THRESHOLD:
        return ids[best], distance
    return None, distance
