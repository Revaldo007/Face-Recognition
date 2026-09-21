from collections import defaultdict
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import extract
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_faculty_profile, require_roles
from app.models import Attendance, AttendanceSession, Course, Department, Faculty, Student, Subject, User
from app.services import attendance_service as svc
from app.services.attendance_service import percentage

router = APIRouter(prefix="/api/reports", tags=["Reports"])
staff = require_roles("admin", "faculty")


def scoped_sessions(db: Session, user: User):
    """Admin sees every session, faculty only their own."""
    q = db.query(AttendanceSession)
    if user.role == "faculty":
        q = q.filter(AttendanceSession.faculty_id == get_faculty_profile(db, user).id)
    return q


def brief(db: Session, session: AttendanceSession) -> dict:
    s = svc.session_summary(db, session)
    s.pop("present"), s.pop("absent")
    return s


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    today = date_type.today()
    sessions = db.query(AttendanceSession).filter(AttendanceSession.date == today).all()
    present = absent = 0
    for s in sessions:
        b = brief(db, s)
        present += b["present_count"]
        absent += b["absent_count"]
    return {
        "students": db.query(Student).count(),
        "faculty": db.query(Faculty).count(),
        "departments": db.query(Department).count(),
        "courses": db.query(Course).count(),
        "subjects": db.query(Subject).count(),
        "today": {"sessions": len(sessions), "present": present, "absent": absent},
    }


@router.get("/daily")
def daily_report(
    date: date_type | None = None, subject_id: int | None = None,
    db: Session = Depends(get_db), user: User = Depends(staff),
):
    """Date | Subject | Total Students | Present | Absent | Attendance %"""
    day = date or date_type.today()
    q = scoped_sessions(db, user).filter(AttendanceSession.date == day)
    if subject_id:
        q = q.filter(AttendanceSession.subject_id == subject_id)
    rows = [brief(db, s) for s in q.order_by(AttendanceSession.start_time).all()]
    return {"date": day.isoformat(), "rows": rows}


@router.get("/monthly")
def monthly_report(
    year: int | None = None, month: int | None = None, subject_id: int | None = None,
    db: Session = Depends(get_db), user: User = Depends(staff),
):
    today = date_type.today()
    year, month = year or today.year, month or today.month
    if not 1 <= month <= 12:
        raise HTTPException(422, "Month must be between 1 and 12")
    q = scoped_sessions(db, user).filter(
        extract("year", AttendanceSession.date) == year, extract("month", AttendanceSession.date) == month
    )
    if subject_id:
        q = q.filter(AttendanceSession.subject_id == subject_id)
    sessions = [brief(db, s) for s in q.order_by(AttendanceSession.date).all()]

    def summarise(items):
        total = sum(i["total_students"] for i in items)
        present = sum(i["present_count"] for i in items)
        return {"sessions": len(items), "total": total, "present": present,
                "absent": total - present, "percentage": percentage(present, total)}

    by_day, by_subject = defaultdict(list), defaultdict(list)
    for s in sessions:
        by_day[s["date"]].append(s)
        by_subject[s["subject"]].append(s)
    return {
        "year": year, "month": month,
        "summary": summarise(sessions),
        "days": [{"date": d, **summarise(v)} for d, v in sorted(by_day.items())],
        "subjects": [{"subject": n, **summarise(v)} for n, v in sorted(by_subject.items())],
    }


@router.get("/subject/{subject_id}")
def subject_report(subject_id: int, db: Session = Depends(get_db), user: User = Depends(staff)):
    """Student | Total Classes | Present | Absent | Percentage  (closed sessions only)"""
    subject = db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(404, "Subject not found")
    if user.role == "faculty" and subject.faculty_id != get_faculty_profile(db, user).id:
        raise HTTPException(403, "This subject is not assigned to you")

    students = (
        db.query(Student)
        .filter(Student.course_id == subject.course_id, Student.semester == subject.semester)
        .order_by(Student.section, Student.roll_number).all()
    )
    records = (
        db.query(Attendance).join(AttendanceSession)
        .filter(AttendanceSession.subject_id == subject_id, AttendanceSession.status == "closed").all()
    )
    stats = defaultdict(lambda: [0, 0])  # student -> [total, present]
    for r in records:
        stats[r.student_id][0] += 1
        stats[r.student_id][1] += 1 if r.status == "PRESENT" else 0
    rows = []
    for s in students:
        total, present = stats[s.id]
        rows.append({"id": s.id, "student_id": s.student_id, "roll_number": s.roll_number, "name": s.name,
                     "section": s.section, "total_classes": total, "present": present,
                     "absent": total - present, "percentage": percentage(present, total)})
    conducted = (
        db.query(AttendanceSession).filter_by(subject_id=subject_id, status="closed").count()
    )
    return {"subject": {"id": subject.id, "name": subject.name, "code": subject.code},
            "classes_conducted": conducted, "students": rows}


@router.get("/student/{student_pk}")
def student_report(student_pk: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Subject | Classes Conducted | Present | Absent | Attendance %  + full history"""
    student = db.get(Student, student_pk)
    if not student:
        raise HTTPException(404, "Student not found")
    if user.role == "student" and student.user_id != user.id:
        raise HTTPException(403, "You can only view your own attendance")

    records = (
        db.query(Attendance, AttendanceSession).join(AttendanceSession, Attendance.session_id == AttendanceSession.id)
        .filter(Attendance.student_id == student.id, AttendanceSession.status == "closed")
        .order_by(AttendanceSession.date.desc(), AttendanceSession.start_time.desc()).all()
    )
    if user.role == "faculty":  # faculty only see records of their own subjects
        fid = get_faculty_profile(db, user).id
        records = [(a, s) for a, s in records if s.faculty_id == fid]

    subjects = db.query(Subject).filter(Subject.course_id == student.course_id, Subject.semester == student.semester).all()
    stats = {s.id: {"subject_id": s.id, "subject": s.name, "code": s.code, "classes": 0, "present": 0} for s in subjects}
    history = []
    for rec, sess in records:
        row = stats.setdefault(sess.subject_id, {"subject_id": sess.subject_id, "subject": sess.subject.name,
                                                  "code": sess.subject.code, "classes": 0, "present": 0})
        row["classes"] += 1
        row["present"] += 1 if rec.status == "PRESENT" else 0
        history.append({"date": sess.date.isoformat(), "subject": sess.subject.name, "status": rec.status,
                        "time": rec.marked_at.strftime("%H:%M:%S") if rec.status == "PRESENT" else None})
    subject_rows = []
    for row in stats.values():
        row["absent"] = row["classes"] - row["present"]
        row["percentage"] = percentage(row["present"], row["classes"])
        subject_rows.append(row)
    total = sum(r["classes"] for r in subject_rows)
    present = sum(r["present"] for r in subject_rows)
    return {
        "student": {"id": student.id, "student_id": student.student_id, "roll_number": student.roll_number, "name": student.name},
        "subjects": sorted(subject_rows, key=lambda r: r["subject"]),
        "overall": {"classes": total, "present": present, "absent": total - present, "percentage": percentage(present, total)},
        "history": history[:300],
    }
