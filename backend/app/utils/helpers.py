from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


def commit_or_409(db: Session, message: str = "Duplicate value or record is in use"):
    """Commit; turn database constraint errors into a clean 409 response."""
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, message)
