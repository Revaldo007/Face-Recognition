from pydantic import BaseModel, Field


class SubjectBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    code: str = Field(min_length=1, max_length=20)
    course_id: int
    department_id: int
    semester: int = Field(ge=1, le=12)
    faculty_id: int | None = None


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    code: str | None = Field(default=None, min_length=1, max_length=20)
    course_id: int | None = None
    department_id: int | None = None
    semester: int | None = Field(default=None, ge=1, le=12)
    faculty_id: int | None = None


class SubjectOut(SubjectBase):
    id: int
    course_name: str | None = None
    department_name: str | None = None
    faculty_name: str | None = None
