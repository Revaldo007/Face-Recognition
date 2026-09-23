"""
Face detection with OpenCV's YuNet detector.

YuNet and SFace (used in face_recognition.py) are small ONNX models that run through
OpenCV itself, so we do NOT need dlib / cmake / a C++ compiler. The .onnx files are
downloaded automatically the first time the server starts (or run: python download_models.py).
"""
import threading
import urllib.request

import cv2
import numpy as np

from app.config import settings

MODEL_FILES = {
    "yunet.onnx": "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    "sface.onnx": "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
}


class FaceError(Exception):
    """A problem with the camera image that we can explain to the user."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def ensure_models() -> None:
    settings.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in MODEL_FILES.items():
        path = settings.MODEL_DIR / name
        if path.exists() and path.stat().st_size > 100_000:
            continue
        print(f"Downloading face model {name} ...")
        try:
            urllib.request.urlretrieve(url, path)
        except Exception as exc:  # network problem
            path.unlink(missing_ok=True)
            raise RuntimeError(
                f"Could not download {name}. Download it manually from {url} "
                f"and save it in {settings.MODEL_DIR}"
            ) from exc
        if path.stat().st_size < 100_000:
            path.unlink(missing_ok=True)
            raise RuntimeError(f"Downloaded {name} looks invalid. Download it manually from {url}")


class FaceEngine:
    """Loads the two OpenCV models once and shares them between requests."""

    def __init__(self):
        self._lock = threading.Lock()
        self._detector = None
        self._recognizer = None

    def _load(self):
        if self._detector is None:
            ensure_models()
            self._detector = cv2.FaceDetectorYN.create(
                str(settings.MODEL_DIR / "yunet.onnx"), "", (320, 320), settings.FACE_DETECT_SCORE, 0.3, 5000
            )
            self._recognizer = cv2.FaceRecognizerSF.create(str(settings.MODEL_DIR / "sface.onnx"), "")

    def detect(self, img: np.ndarray) -> list[np.ndarray]:
        with self._lock:
            self._load()
            h, w = img.shape[:2]
            self._detector.setInputSize((w, h))
            _, faces = self._detector.detect(img)
        return [] if faces is None else list(faces)

    def embed(self, img: np.ndarray, face: np.ndarray) -> np.ndarray:
        with self._lock:
            self._load()
            aligned = self._recognizer.alignCrop(img, face)
            feature = self._recognizer.feature(aligned)
        vec = feature.flatten().astype(np.float32)
        return vec / (np.linalg.norm(vec) + 1e-9)


engine = FaceEngine()


# ---------------------------------------------------------------- helpers
def decode_image(data: bytes) -> np.ndarray:
    """Bytes from the browser -> OpenCV image (BGR). Raises FaceError for bad input."""
    if not data:
        raise FaceError("Invalid camera input: empty image")
    img = cv2.imdecode(np.frombuffer(data, dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise FaceError("Invalid camera input: could not read the image")
    h, w = img.shape[:2]
    if w > settings.MAX_IMAGE_WIDTH:  # smaller frames = faster detection
        scale = settings.MAX_IMAGE_WIDTH / w
        img = cv2.resize(img, (settings.MAX_IMAGE_WIDTH, int(h * scale)))
    return img


def detect_faces(img: np.ndarray) -> list[np.ndarray]:
    return engine.detect(img)


def face_box(img: np.ndarray, face: np.ndarray) -> dict:
    """Bounding box as fractions of the image size, so the browser can draw it at any size."""
    h, w = img.shape[:2]
    x, y, bw, bh = [float(v) for v in face[:4]]
    return {
        "x": max(0.0, x / w), "y": max(0.0, y / h),
        "w": min(1.0, bw / w), "h": min(1.0, bh / h),
    }


def face_problem(img: np.ndarray, face: np.ndarray) -> str | None:
    """Returns a message if this face is too small / dark / blurry to use, else None."""
    h, w = img.shape[:2]
    x, y, bw, bh = [int(v) for v in face[:4]]
    if bw < settings.MIN_FACE_SIZE:
        return "Face too small - please move closer to the camera"
    x0, y0 = max(0, x), max(0, y)
    crop = img[y0:min(h, y + bh), x0:min(w, x + bw)]
    if crop.size == 0:
        return "Face is outside the camera view"
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    if gray.mean() < settings.MIN_BRIGHTNESS:
        return "Image too dark - please improve the lighting"
    if cv2.Laplacian(gray, cv2.CV_64F).var() < settings.MIN_SHARPNESS:
        return "Poor image quality - please hold still and face the camera"
    return None


def is_spoof_attack(img: np.ndarray, face: np.ndarray) -> tuple[bool, str]:
    """
    Multi-signal anti-spoofing check to block photo / mobile-screen attacks.

    Uses four independent signals without requiring any extra model download:
      1. Screen specular glare   – glass screens produce sharp overexposed patches
      2. YCrCb chroma deviation  – digital screens shift blue-red balance vs real skin
      3. FFT high-freq energy    – Moiré / pixel-grid patterns push power into high frequencies
      4. Device-bezel heuristic  – straight rectangular lines around the face region

    Returns (is_spoof: bool, reason: str).
    A frame must fail **two or more** independent signals to be rejected so that
    ordinary lighting artefacts on a real person don't cause false positives.
    """
    h, w = img.shape[:2]
    x, y, bw, bh = [int(v) for v in face[:4]]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(w, x + bw), min(h, y + bh)
    crop = img[y0:y1, x0:x1]

    if crop.size == 0 or bw < 40 or bh < 40:
        return False, ""  # not enough data – pass through

    flags: list[str] = []

    # ── Signal 1: specular screen glare ────────────────────────────────────
    # Screens under strong backlight produce clusters of near-white pixels.
    # A real face illuminated by room lighting rarely has >6 % of pixels above 250 V.
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    glare_ratio = float(np.mean(hsv[:, :, 2] > 250))
    if glare_ratio > 0.06:
        flags.append("screen glare")

    # ── Signal 2: YCrCb chroma balance ─────────────────────────────────────
    # Human skin has Cr consistently higher than Cb (warm reddish tone).
    # Mobile OLED/LCD screens are blue-biased; Cr–Cb difference drops significantly.
    ycrcb = cv2.cvtColor(crop, cv2.COLOR_BGR2YCrCb)
    cr_mean = float(np.mean(ycrcb[:, :, 1]))
    cb_mean = float(np.mean(ycrcb[:, :, 2]))
    if (cr_mean - cb_mean) < 2.0:  # real skin: typically +10 to +30
        flags.append("unnatural screen chroma")

    # ── Signal 3: FFT high-frequency energy (Moiré / pixel grid) ──────────
    # A mobile display is a regular grid of sub-pixels.  When photographed,
    # the aliasing produces a strong ring of energy at radii > 50 in a 128×128 FFT.
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    resized_gray = cv2.resize(gray, (128, 128))
    magnitude = np.abs(np.fft.fftshift(np.fft.fft2(resized_gray)))
    gy, gx = np.ogrid[:128, :128]
    r = np.sqrt((gx - 64) ** 2 + (gy - 64) ** 2)
    hf_ratio = float(np.sum(magnitude[r >= 50]) / (np.sum(magnitude) + 1e-6))
    if hf_ratio > 0.72:   # empirically, real-face frames ≈ 0.60–0.70; screen ≥ 0.73
        flags.append("Moiré / screen pixel-grid pattern")

    # ── Signal 4: device-bezel / rectangular frame detection ────────────────
    # When someone holds a phone in front of the camera, the phone's rectangular
    # border appears as 4+ long horizontal/vertical lines around the face.
    pad = int(max(bw, bh) * 0.4)
    bx0, by0 = max(0, x - pad), max(0, y - pad)
    bx1, by1 = min(w, x + bw + pad), min(h, y + bh + pad)
    roi = img[by0:by1, bx0:bx1]
    if roi.size > 0:
        roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(roi_gray, 50, 150)
        min_len = int(min(roi.shape[:2]) * 0.3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180,
                                threshold=int(min_len * 1.2),
                                minLineLength=min_len,
                                maxLineGap=6)
        if lines is not None:
            bezel = sum(
                1 for line in lines
                for lx1, ly1, lx2, ly2 in [line[0]]
                if abs(lx2 - lx1) > abs(ly2 - ly1) * 3     # nearly horizontal
                or abs(ly2 - ly1) > abs(lx2 - lx1) * 3     # nearly vertical
            )
            if bezel >= 4:
                flags.append("mobile device frame / bezel")

    # Require at least 2 independent signals to confirm a spoof attack
    if len(flags) >= 2:
        return True, "Liveness check failed – please look directly into the webcam"
    return False, ""
