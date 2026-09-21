from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_faculty_profile, get_student_profile, require_roles
from app.models import Course, Department, Faculty, Subject, User
from app.schemas.subject import SubjectCreate, SubjectOut, SubjectUpdate
from app.utils.helpers import commit_or_409

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])
admin_only = require_roles("admin")


def to_out(s: Subject) -> SubjectOut:
    return SubjectOut(
        id=s.id, name=s.name, code=s.code, course_id=s.course_id, department_id=s.department_id,
        semester=s.semester, faculty_id=s.faculty_id,
        course_name=s.course.name if s.course else None,
        department_name=s.department.name if s.department else None,
        faculty_name=s.faculty.name if s.faculty else None,
    )


def check_references(db: Session, course_id=None, department_id=None, faculty_id=None):
    if course_id is not None and not db.get(Course, course_id):
        raise HTTPException(404, "Course not found")
    if department_id is not None and not db.get(Department, department_id):
        raise HTTPException(404, "Department not found")
    if faculty_id is not None and not db.get(Faculty, faculty_id):
        raise HTTPException(404, "Faculty not found")


@router.post("", response_model=SubjectOut, status_code=201)
def create_subject(data: SubjectCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    check_references(db, data.course_id, data.department_id, data.faculty_id)
    subject = Subject(**data.model_dump())
    db.add(subject)
    commit_or_409(db, "Subject code already exists")
    db.refresh(subject)
    return to_out(subject)


@router.get("", response_model=list[SubjectOut])
def list_subjects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Admin: all subjects. Faculty: only their own. Student: subjects of their course & semester."""
    q = db.query(Subject)
    if user.role == "faculty":
        q = q.filter(Subject.faculty_id == get_faculty_profile(db, user).id)
    elif user.role == "student":
        st = get_student_profile(db, user)
        q = q.filter(Subject.course_id == st.course_id, Subject.semester == st.semester)
    return [to_out(s) for s in q.order_by(Subject.name).all()]


@router.put("/{subject_id}", response_model=SubjectOut)
def update_subject(subject_id: int, data: SubjectUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    subject = db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(404, "Subject not found")
    changes = data.model_dump(exclude_unset=True)
    check_references(db, changes.get("course_id"), changes.get("department_id"), changes.get("faculty_id"))
    for key, value in changes.items():
        setattr(subject, key, value)
    commit_or_409(db, "Subject code already exists")
    db.refresh(subject)
    return to_out(subject)


@router.delete("/{subject_id}", status_code=204)
def delete_subject(subject_id: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    subject = db.get(Subject, subject_id)
    if not subject:
        raise HTTPException(404, "Subject not found")
    db.delete(subject)
    commit_or_409(db, "Subject has attendance sessions and cannot be deleted")
