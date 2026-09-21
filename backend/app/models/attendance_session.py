import datetime as dt

from sqlalchemy import Date, ForeignKey, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    faculty_id: Mapped[int] = mapped_column(ForeignKey("faculty.id"))
    section: Mapped[str] = mapped_column(String(10))
    date: Mapped[dt.date] = mapped_column(Date)
    start_time: Mapped[dt.time] = mapped_column(Time)
    end_time: Mapped[dt.time | None] = mapped_column(Time, nullable=True)
    status: Mapped[str] = mapped_column(String(10), default="active")  # active | closed

    subject = relationship("Subject")
    faculty = relationship("Faculty")
    records = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")
