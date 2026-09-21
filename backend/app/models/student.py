from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    roll_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    year: Mapped[int]
    semester: Mapped[int]
    section: Mapped[str] = mapped_column(String(10))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    user = relationship("User")
    department = relationship("Department")
    course = relationship("Course")
    face_data = relationship("FaceData", back_populates="student", uselist=False, cascade="all, delete-orphan")
    attendance = relationship("Attendance", back_populates="student", cascade="all, delete-orphan")
