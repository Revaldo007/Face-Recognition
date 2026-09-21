from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Course, Department
from app.schemas.course import CourseCreate, CourseOut, CourseUpdate
from app.utils.helpers import commit_or_409

router = APIRouter(prefix="/api/courses", tags=["Courses"])
admin_only = require_roles("admin")


def to_out(c: Course) -> CourseOut:
    return CourseOut(
        id=c.id, name=c.name, code=c.code, department_id=c.department_id,
        duration=c.duration, description=c.description,
        department_name=c.department.name if c.department else None,
    )


def check_department(db: Session, department_id: int):
    if not db.get(Department, department_id):
        raise HTTPException(404, "Department not found")


@router.post("", response_model=CourseOut, status_code=201)
def create_course(data: CourseCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    check_department(db, data.department_id)
    course = Course(**data.model_dump())
    db.add(course)
    commit_or_409(db, "Course code already exists")
    db.refresh(course)
    return to_out(course)


@router.get("", response_model=list[CourseOut])
def list_courses(department_id: int | None = None, db: Session = Depends(get_db), _=Depends(get_current_user)):
    q = db.query(Course)
    if department_id:
        q = q.filter(Course.department_id == department_id)
    return [to_out(c) for c in q.order_by(Course.name).all()]


@router.put("/{course_id}", response_model=CourseOut)
def update_course(course_id: int, data: CourseUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(404, "Course not found")
    changes = data.model_dump(exclude_unset=True)
    if "department_id" in changes:
        check_department(db, changes["department_id"])
    for key, value in changes.items():
        setattr(course, key, value)
    commit_or_409(db, "Course code already exists")
    db.refresh(course)
    return to_out(course)


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    course = db.get(Course, course_id)
    if not course:
        raise HTTPException(404, "Course not found")
    db.delete(course)
    commit_or_409(db, "Course is in use by students or subjects")
