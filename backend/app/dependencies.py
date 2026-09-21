from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Faculty, Student
from app.utils.security import decode_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    """Reads the JWT from the Authorization header and returns the logged-in user."""
    unauthorized = HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    if creds is None:
        raise unauthorized
    payload = decode_token(creds.credentials)
    if not payload:
        raise unauthorized
    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise unauthorized
    return user


def require_roles(*roles: str):
    """Role-based authorization: the backend checks the role on every protected route."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have permission for this action")
        return user

    return checker


def get_faculty_profile(db: Session, user: User) -> Faculty:
    faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
    if not faculty:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Faculty profile not found")
    return faculty


def get_student_profile(db: Session, user: User) -> Student:
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Student profile not found")
    return student
