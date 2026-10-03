from datetime import date as date_type

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_faculty_profile, require_roles
from app.models import AttendanceSession, User
from app.schemas.attendance import SessionCreate
from app.services import attendance_service as svc
from app.services import face_detection as fd
from app.services import face_recognition as fr

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])
faculty_only = require_roles("faculty")
staff = require_roles("admin", "faculty")


def load_session(db: Session, session_id: int, user: User) -> AttendanceSession:
    session = db.get(AttendanceSession, session_id)
    if not session:
        raise HTTPException(404, "Attendance session not found")
    if user.role == "faculty" and session.faculty_id != get_faculty_profile(db, user).id:
        raise HTTPException(403, "This is not your attendance session")
    return session


@router.post("/session", status_code=201)
def start_session(data: SessionCreate, db: Session = Depends(get_db), user: User = Depends(faculty_only)):
    faculty = get_faculty_profile(db, user)
    session, created = svc.create_session(db, faculty, data.subject_id, data.section.strip().upper())
    return {**svc.session_summary(db, session), "resumed": not created}


@router.get("/sessions")
def list_sessions(
    date: date_type | None = None, subject_id: int | None = None, status: str | None = None,
    db: Session = Depends(get_db), user: User = Depends(staff),
):
    q = db.query(AttendanceSession)
    if user.role == "faculty":
        q = q.filter(AttendanceSession.faculty_id == get_faculty_profile(db, user).id)
    if date:
        q = q.filter(AttendanceSession.date == date)
    if subject_id:
        q = q.filter(AttendanceSession.subject_id == subject_id)
    if status:
        q = q.filter(AttendanceSession.status == status)
    sessions = q.order_by(AttendanceSession.date.desc(), AttendanceSession.start_time.desc()).limit(200).all()
    result = []
    for s in sessions:
        summary = svc.session_summary(db, s)
        summary.pop("present"), summary.pop("absent")  # keep the list light
        result.append(summary)
    return result


@router.get("/session/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db), user: User = Depends(staff)):
    return svc.session_summary(db, load_session(db, session_id, user))


@router.post("/session/{session_id}/close")
def close_session(session_id: int, db: Session = Depends(get_db), user: User = Depends(faculty_only)):
    session = load_session(db, session_id, user)
    return svc.close_session(db, session)


@router.post("/recognize")
def recognize(
    session_id: int = Form(...), image: UploadFile = File(...),
    db: Session = Depends(get_db), user: User = Depends(faculty_only),
):
    """
    One camera frame in -> faces detected -> students recognised -> attendance marked.
    (Plain `def` so FastAPI runs the heavy OpenCV work in a worker thread.)
    """
    session = load_session(db, session_id, user)
    if session.status != "active":
        raise HTTPException(409, "This attendance session is closed")

    def reply(message, faces=None):
        summary = svc.session_summary(db, session)
        return {"message": message, "faces": faces or [], "present_count": summary["present_count"],
                "total_students": summary["total_students"]}

    try:
        img = fd.decode_image(image.file.read())
    except fd.FaceError as e:
        return reply(e.message)

    detected = fd.detect_faces(img)
    if not detected:
        return reply("No face detected. Please position your face in front of the camera")

    # Only students of THIS class (course + semester + section) who have an enrolled face
    gallery = {
        s.id: fr.embedding_from_bytes(s.face_data.face_embedding)
        for s in svc.class_students(db, session) if s.face_data
    }
    if not gallery:
        return reply("No enrolled faces found for this class. Enroll students first")

    students = {s.id: s for s in svc.class_students(db, session)}
    results = []
    for face in detected:
        item = {"box": fd.face_box(img, face), "recognized": False}
        problem = fd.face_problem(img, face)
        if problem:
            item.update(status="POOR_IMAGE", message=problem)
            results.append(item)
            continue
        student_id, distance = fr.best_match(fr.get_embedding(img, face), gallery)
        if student_id is None:
            item.update(status="NOT_RECOGNIZED", message="Student Not Recognized", distance=distance)
        else:
            record, created = svc.mark_present(db, session, student_id, distance)
            s = students[student_id]
            item.update(
                recognized=True,
                status="PRESENT" if created else "ALREADY_MARKED",
                message=f"{s.name} marked PRESENT" if created else f"{s.name} already marked present",
                student={"id": s.id, "student_id": s.student_id, "roll_number": s.roll_number, "name": s.name},
                time=record.marked_at.strftime("%H:%M:%S"),
                distance=distance,
            )
        results.append(item)

    message = "Multiple faces detected" if len(detected) > 1 else results[0]["message"]
    return reply(message, results)
