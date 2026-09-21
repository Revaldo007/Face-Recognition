from pydantic import BaseModel, Field


class CourseBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    code: str = Field(min_length=1, max_length=20)
    department_id: int
    duration: str | None = None
    description: str | None = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    code: str | None = Field(default=None, min_length=1, max_length=20)
    department_id: int | None = None
    duration: str | None = None
    description: str | None = None


class CourseOut(CourseBase):
    id: int
    department_name: str | None = None
