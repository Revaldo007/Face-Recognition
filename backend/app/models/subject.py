from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150))
    code: Mapped[str] = mapped_column(String(20), unique=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    semester: Mapped[int]
    faculty_id: Mapped[int | None] = mapped_column(ForeignKey("faculty.id"), nullable=True)

    course = relationship("Course")
    department = relationship("Department")
    faculty = relationship("Faculty")
