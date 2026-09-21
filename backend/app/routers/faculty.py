from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_roles
from app.models import AttendanceSession, Department, Faculty, Subject, User
from app.schemas.faculty import FacultyCreate, FacultyOut, FacultyUpdate
from app.utils.helpers import commit_or_409
from app.utils.security import hash_password

router = APIRouter(prefix="/api/faculty", tags=["Faculty"])
admin_only = require_roles("admin")


def to_out(f: Faculty) -> FacultyOut:
    return FacultyOut(
        id=f.id, faculty_id=f.faculty_id, name=f.name, email=f.email, phone=f.phone,
        department_id=f.department_id, designation=f.designation,
        department_name=f.department.name if f.department else None,
    )


def check_unique(db: Session, faculty_id=None, email=None, exclude: Faculty | None = None):
    if faculty_id:
        q = db.query(Faculty).filter(Faculty.faculty_id == faculty_id)
        if exclude:
            q = q.filter(Faculty.id != exclude.id)
        if q.first():
            raise HTTPException(409, "Faculty ID already exists")
    if email:
        q = db.query(User).filter(User.email == email.lower())
        if exclude:
            q = q.filter(User.id != exclude.user_id)
        if q.first():
            raise HTTPException(409, "Email already in use")


@router.post("", response_model=FacultyOut, status_code=201)
def create_faculty(data: FacultyCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    if not db.get(Department, data.department_id):
        raise HTTPException(404, "Department not found")
    check_unique(db, data.faculty_id, data.email)
    user = User(email=data.email.lower(), password_hash=hash_password(data.password), role="faculty")
    db.add(user)
    db.flush()
    payload = data.model_dump(exclude={"password"})
    payload["email"] = payload["email"].lower()
    faculty = Faculty(**payload, user_id=user.id)
    db.add(faculty)
    commit_or_409(db, "Faculty ID or email already exists")
    db.refresh(faculty)
    return to_out(faculty)


@router.get("", response_model=list[FacultyOut])
def list_faculty(db: Session = Depends(get_db), _=Depends(admin_only)):
    return [to_out(f) for f in db.query(Faculty).order_by(Faculty.name).all()]


@router.put("/{faculty_pk}", response_model=FacultyOut)
def update_faculty(faculty_pk: int, data: FacultyUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    faculty = db.get(Faculty, faculty_pk)
    if not faculty:
        raise HTTPException(404, "Faculty not found")
    changes = data.model_dump(exclude_unset=True)
    if "department_id" in changes and not db.get(Department, changes["department_id"]):
        raise HTTPException(404, "Department not found")
    check_unique(db, changes.get("faculty_id"), changes.get("email"), exclude=faculty)
    password = changes.pop("password", None)
    if password:
        faculty.user.password_hash = hash_password(password)
    if "email" in changes:
        changes["email"] = changes["email"].lower()
        faculty.user.email = changes["email"]
    for key, value in changes.items():
        setattr(faculty, key, value)
    commit_or_409(db)
    db.refresh(faculty)
    return to_out(faculty)


@router.delete("/{faculty_pk}", status_code=204)
def delete_faculty(faculty_pk: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    faculty = db.get(Faculty, faculty_pk)
    if not faculty:
        raise HTTPException(404, "Faculty not found")
    if db.query(AttendanceSession).filter_by(faculty_id=faculty.id).first():
        raise HTTPException(409, "Faculty has attendance sessions and cannot be deleted")
    db.query(Subject).filter(Subject.faculty_id == faculty.id).update({"faculty_id": None})
    user = faculty.user
    db.delete(faculty)
    db.flush()
    db.delete(user)
    commit_or_409(db)
