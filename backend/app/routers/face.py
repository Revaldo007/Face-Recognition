from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models import FaceData, Student
from app.services import face_detection as fd
from app.services import face_recognition as fr

router = APIRouter(prefix="/api/face", tags=["Face Enrollment"])
staff = require_roles("admin", "faculty")

NO_FACE = "No face detected. Please position your face in front of the camera"


@router.post("/detect")
async def detect(image: UploadFile = File(...), _=Depends(staff)):
    """Lightweight check used by the camera preview ("Face Detected" indicator)."""
    try:
        img = fd.decode_image(await image.read())
    except fd.FaceError as e:
        return {"face_count": 0, "message": e.message, "boxes": []}
    faces = fd.detect_faces(img)
    boxes = [fd.face_box(img, f) for f in faces]
    if not faces:
        return {"face_count": 0, "message": NO_FACE, "boxes": []}
    if len(faces) > 1:
        return {"face_count": len(faces), "message": "Multiple faces detected. Only one person should be in front of the camera", "boxes": boxes}
    problem = fd.face_problem(img, faces[0])
    return {"face_count": 1, "message": problem or "Face detected", "ok": problem is None, "boxes": boxes}


@router.post("/enroll/{student_pk}")
async def enroll(student_pk: int, images: list[UploadFile] = File(...), db: Session = Depends(get_db), _=Depends(staff)):
    """
    Enrollment: several photos of one student -> face embeddings -> averaged -> stored.
    Only the embedding is stored in the database (the photos are not kept).
    """
    student = db.get(Student, student_pk)
    if not student:
        raise HTTPException(404, "Student not found")
    if not images:
        raise HTTPException(422, "Please capture at least one photo")

    embeddings, problems = [], []
    for upload in images[:8]:
        try:
            img = fd.decode_image(await upload.read())
        except fd.FaceError as e:
            problems.append(e.message)
            continue
        faces = fd.detect_faces(img)
        if not faces:
            problems.append(NO_FACE)
        elif len(faces) > 1:
            problems.append("Multiple faces detected")
        else:
            problem = fd.face_problem(img, faces[0])
            if problem:
                problems.append(problem)
            else:
                embeddings.append(fr.get_embedding(img, faces[0]))

    if not embeddings:
        raise HTTPException(422, problems[0] if problems else NO_FACE)

    blob = fr.embedding_to_bytes(fr.average_embeddings(embeddings))
    record = db.query(FaceData).filter_by(student_id=student.id).first()
    if record:
        record.face_embedding = blob
    else:
        db.add(FaceData(student_id=student.id, face_embedding=blob))
    db.commit()
    return {"message": f"Face enrolled for {student.name}", "photos_used": len(embeddings), "photos_rejected": len(problems)}


@router.get("/status/{student_pk}")
def status(student_pk: int, db: Session = Depends(get_db), _=Depends(staff)):
    if not db.get(Student, student_pk):
        raise HTTPException(404, "Student not found")
    record = db.query(FaceData).filter_by(student_id=student_pk).first()
    # Only status information is returned - never the embedding itself
    return {"enrolled": record is not None, "updated_at": record.updated_at if record else None}


@router.delete("/{student_pk}", status_code=204)
def delete_face(student_pk: int, db: Session = Depends(get_db), _=Depends(staff)):
    record = db.query(FaceData).filter_by(student_id=student_pk).first()
    if not record:
        raise HTTPException(404, "No face data for this student")
    db.delete(record)
    db.commit()
