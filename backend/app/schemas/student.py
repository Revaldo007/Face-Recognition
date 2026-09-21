from pydantic import BaseModel, EmailStr, Field


class StudentBase(BaseModel):
    student_id: str = Field(min_length=1, max_length=50)
    roll_number: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    department_id: int
    course_id: int
    year: int = Field(ge=1, le=6)
    semester: int = Field(ge=1, le=12)
    section: str = Field(min_length=1, max_length=10)


class StudentCreate(StudentBase):
    password: str = Field(min_length=6, max_length=72)


class StudentUpdate(BaseModel):
    student_id: str | None = Field(default=None, min_length=1, max_length=50)
    roll_number: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    department_id: int | None = None
    course_id: int | None = None
    year: int | None = Field(default=None, ge=1, le=6)
    semester: int | None = Field(default=None, ge=1, le=12)
    section: str | None = Field(default=None, min_length=1, max_length=10)
    password: str | None = Field(default=None, min_length=6, max_length=72)


class StudentOut(StudentBase):
    id: int
    department_name: str | None = None
    course_name: str | None = None
    face_enrolled: bool = False  # only a yes/no flag - never the embedding itself
