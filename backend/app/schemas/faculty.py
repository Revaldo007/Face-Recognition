from pydantic import BaseModel, EmailStr, Field


class FacultyBase(BaseModel):
    faculty_id: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=20)
    department_id: int
    designation: str | None = Field(default=None, max_length=80)


class FacultyCreate(FacultyBase):
    password: str = Field(min_length=6, max_length=72)


class FacultyUpdate(BaseModel):
    faculty_id: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    department_id: int | None = None
    designation: str | None = Field(default=None, max_length=80)
    password: str | None = Field(default=None, min_length=6, max_length=72)


class FacultyOut(FacultyBase):
    id: int
    department_name: str | None = None
