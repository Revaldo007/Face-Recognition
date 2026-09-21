"""All attendance business rules live here (used by the routers)."""
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Attendance, AttendanceSession, Faculty, Student, Subject


def percentage(present: int, total: int) -> float:
    """Attendance % = (present classes / total classes) x 100"""
    return round(present / total * 100, 1) if total else 0.0


def class_students(db: Session, session: AttendanceSession) -> list[Student]:
    """Every student who belongs to this session's class (course + semester + section)."""
    subject = session.subject
    return (
        db.query(Student)
        .filter(
            Student.course_id == subject.course_id,
            Student.semester == subject.semester,
            Student.section == session.section,
        )
        .order_by(Student.roll_number)
        .all()
    )


def create_session(db: Session, faculty: Faculty, subject_id: int, section: str) -> tuple[AttendanceSession, bool]:
    subject = db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(404, "Subject not found")
    if subject.faculty_id != faculty.id:
        raise HTTPException(403, "This subject is not assigned to you")

    now = datetime.now()
    existing = (
        db.query(AttendanceSession)
        .filter_by(subject_id=subject_id, faculty_id=faculty.id, section=section, date=now.date(), status="active")
        .first()
    )
    if existing:  # resume instead of creating a second active session
        return existing, False

    session = AttendanceSession(
        subject_id=subject_id, faculty_id=faculty.id, section=section,
        date=now.date(), start_time=now.time().replace(microsecond=0), status="active",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session, True


def mark_present(db: Session, session: AttendanceSession, student_id: int, distance: float):
    """
    Marks a student PRESENT unless already marked in this session.
    Returns (record, created). The check is done here on the backend AND the
    database unique constraint (session_id + student_id) protects against races.
    """
    existing = db.query(Attendance).filter_by(session_id=session.id, student_id=student_id).first()
    if existing:
        return existing, False
    record = Attendance(
        session_id=session.id, student_id=student_id, status="PRESENT",
        marked_at=datetime.now(), recognition_distance=round(distance, 4),
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return db.query(Attendance).filter_by(session_id=session.id, student_id=student_id).first(), False
    db.refresh(record)
    return record, True


def close_session(db: Session, session: AttendanceSession) -> dict:
    """Ends the session and records everyone who was not recognised as ABSENT."""
    if session.status == "closed":
        return session_summary(db, session)
    students = class_students(db, session)
    already_recorded = {r.student_id for r in session.records}
    now = datetime.now()
    for s in students:
        if s.id not in already_recorded:
            db.add(Attendance(session_id=session.id, student_id=s.id, status="ABSENT", marked_at=now))
    session.status = "closed"
    session.end_time = now.time().replace(microsecond=0)
    db.commit()
    db.refresh(session)
    return session_summary(db, session)


def session_summary(db: Session, session: AttendanceSession) -> dict:
    """Session details + present list + absent list (All Students - Present Students = Absent)."""
    students = class_students(db, session)
    records = {r.student_id: r for r in session.records}
    present, absent = [], []
    for s in students:
        rec = records.get(s.id)
        info = {"id": s.id, "student_id": s.student_id, "roll_number": s.roll_number, "name": s.name}
        if rec and rec.status == "PRESENT":
            present.append({**info, "marked_at": rec.marked_at.isoformat(), "time": rec.marked_at.strftime("%H:%M:%S"),
                            "distance": rec.recognition_distance})
        else:
            absent.append(info)
    total = len(students)
    return {
        "id": session.id,
        "subject_id": session.subject_id,
        "subject": session.subject.name,
        "subject_code": session.subject.code,
        "course": session.subject.course.name,
        "semester": session.subject.semester,
        "section": session.section,
        "faculty": session.faculty.name,
        "date": session.date.isoformat(),
        "start_time": session.start_time.isoformat(),
        "end_time": session.end_time.isoformat() if session.end_time else None,
        "status": session.status,
        "total_students": total,
        "present_count": len(present),
        "absent_count": total - len(present),
        "percentage": percentage(len(present), total),
        "present": present,
        "absent": absent,
    }
