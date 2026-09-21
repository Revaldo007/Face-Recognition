from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_roles
from app.models import Department
from app.schemas.department import DepartmentCreate, DepartmentOut, DepartmentUpdate
from app.utils.helpers import commit_or_409

router = APIRouter(prefix="/api/departments", tags=["Departments"])
admin_only = require_roles("admin")


@router.post("", response_model=DepartmentOut, status_code=201)
def create_department(data: DepartmentCreate, db: Session = Depends(get_db), _=Depends(admin_only)):
    dept = Department(**data.model_dump())
    db.add(dept)
    commit_or_409(db, "Department name or code already exists")
    db.refresh(dept)
    return dept


@router.get("", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Department).order_by(Department.name).all()


@router.put("/{dept_id}", response_model=DepartmentOut)
def update_department(dept_id: int, data: DepartmentUpdate, db: Session = Depends(get_db), _=Depends(admin_only)):
    dept = db.get(Department, dept_id)
    if not dept:
        raise HTTPException(404, "Department not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(dept, key, value)
    commit_or_409(db, "Department name or code already exists")
    db.refresh(dept)
    return dept


@router.delete("/{dept_id}", status_code=204)
def delete_department(dept_id: int, db: Session = Depends(get_db), _=Depends(admin_only)):
    dept = db.get(Department, dept_id)
    if not dept:
        raise HTTPException(404, "Department not found")
    db.delete(dept)
    commit_or_409(db, "Department is in use by courses, students, faculty or subjects")
