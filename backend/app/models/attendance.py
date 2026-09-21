from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Attendance(Base):
    __tablename__ = "attendance"
    # One record per student per session -> the database itself blocks duplicates
    __table_args__ = (UniqueConstraint("session_id", "student_id", name="uq_session_student"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("attendance_sessions.id"))
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"))
    marked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    status: Mapped[str] = mapped_column(String(10))  # PRESENT | ABSENT
    recognition_distance: Mapped[float | None] = mapped_column(Float, nullable=True)  # 1 - cosine similarity

    session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance")
