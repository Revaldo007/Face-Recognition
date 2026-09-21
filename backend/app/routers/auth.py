from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Faculty, Student, User
from app.schemas.auth import LoginRequest, MeResponse, TokenResponse
from app.utils.security import create_access_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is disabled")
    return TokenResponse(access_token=create_access_token(user.id, user.role), role=user.role)


@router.get("/me", response_model=MeResponse)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name, profile_id = "Administrator", None
    if user.role == "student":
        s = db.query(Student).filter(Student.user_id == user.id).first()
        if s:
            name, profile_id = s.name, s.id
    elif user.role == "faculty":
        f = db.query(Faculty).filter(Faculty.user_id == user.id).first()
        if f:
            name, profile_id = f.name, f.id
    return MeResponse(id=user.id, email=user.email, role=user.role, name=name, profile_id=profile_id)
