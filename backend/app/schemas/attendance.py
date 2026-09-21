from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    subject_id: int
    section: str = Field(min_length=1, max_length=10)
