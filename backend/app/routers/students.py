from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Course, Department, Student, User
from app.schemas.student import StudentCreate, StudentOut, StudentUpdate
from app.utils.helpers import commit_or_409
from app.utils.security import hash_password

router = APIRouter(prefix="/api/students", tags=["Students"])
admin_only = require_roles("admin")
staff = require_roles("admin", "faculty")


def to_out(s: Student) -> StudentOut:
    return StudentOut(
        id=s.id, student_id=s.student_id, roll_number=s.roll_number, name=s.name, email=s.email,
        phone=s.phone, department_id=s.department_id, course_id=s.course_id, year=s.year,
        semester=s.semester, section=s.section,
        department_name=s.department.name if s.department else None,
        course_name=s.course.name if s.course else None,
        face_enrolled=s.face_data is not None,
    )


def check_unique(db: Session, student_id=None, roll_number=None, email=None, exclude: Student | None = None):
    def taken(model_filter):
        q = db.query(Student).filter(model_filter)
        if exclude:
            q = q.filter(Student.id != exclude.id)
        return q.first() is not None

    if student_id and taken(Student.student_id == student_id):
        raise HTTPException(409, "Student ID already exists")
    if roll_number and taken(Student.roll_number == roll_number):
        raise HTTPException(409, "Roll number already exists")
    if email:
        q = db.query(User).filter(User.email == email.lower())
        if exclude:
            q = q.filter(User.id != exclude.user_id)
        if q.first():
            raise HTTPException(409, "Email already in use")


def check_refs(db: Session, department_id=None, course_id=None):
    if department_id is not None and not db.get(Department, department_id):
        raise HTTPException(404, "Department not found")
    if course_id is not None and not db.get(Course, course_id):
        raise HTTPException(404, "Course not found")


@router.post("", response_model=StudentOut, status_code=201)
def create_student(data: StudentCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    check_refs(db, data.department_id, data.course_id)
    check_unique(db, data.student_id, data.roll_number, data.email)
    user = User(email=data.email.lower(), password_hash=hash_password(data.password), role="student")
    db.add(user)
    db.flush()  # gives user.id without committing yet
    payload = data.model_dump(exclude={"password"})
    payload["email"] = payload["email"].lower()
    student = Student(**payload, user_id=user.id)
    db.add(student)
    commit_or_409(db, "Student ID, roll number or email already exists")
    db.refresh(student)
    return to_out(student)


@router.get("", response_model=list[StudentOut])
def list_students(
    search: str | None = None, department_id: int | None = None, course_id: int | None = None,
    semester: int | None = None, section: str | None = None,
    db: Session = Depends(get_db), _=Depends(staff),
):
    q = db.query(Student)
    if search:
        like = f"%{search}%"
        q = q.filter(or_(Student.name.ilike(like), Student.student_id.ilike(like),
                         Student.roll_number.ilike(like), Student.email.ilike(like)))
    if department_id:
        q = q.filter(Student.department_id == department_id)
    if course_id:
        q = q.filter(Student.course_id == course_id)
    if semester:
        q = q.filter(Student.semester == semester)
    if section:
        q = q.filter(Student.section == section)
    return [to_out(s) for s in q.order_by(Student.roll_number).all()]


@router.get("/{student_pk}", response_model=StudentOut)
def get_student(student_pk: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    student = db.get(Student, student_pk)
    if not student:
        raise HTTPException(404, "Student not found")
    if user.role == "student" and student.user_id != user.id:  # students may only see themselves
        raise HTTPException(403, "You can only view your own profile")
    return to_out(student)


@router.put("/{student_pk}", response_model=StudentOut)
def update_student(student_pk: int, data: StudentUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    student = db.get(Student, student_pk)
    if not student:
        raise HTTPException(404, "Student not found")
    changes = data.model_dump(exclude_unset=True)
    check_refs(db, changes.get("department_id"), changes.get("course_id"))
    check_unique(db, changes.get("student_id"), changes.get("roll_number"), changes.get("email"), exclude=student)
    password = changes.pop("password", None)
    if password:
        student.user.password_hash = hash_password(password)
    if "email" in changes:
        changes["email"] = changes["email"].lower()
        student.user.email = changes["email"]
    for key, value in changes.items():
        setattr(student, key, value)
    commit_or_409(db)
    db.refresh(student)
    return to_out(student)


@router.delete("/{student_pk}", status_code=204)
def delete_student(student_pk: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    student = db.get(Student, student_pk)
    if not student:
        raise HTTPException(404, "Student not found")
    user = student.user
    db.delete(student)   # also deletes face data + attendance (cascade)
    db.flush()
    db.delete(user)
    commit_or_409(db)
