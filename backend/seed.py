"""
Creates the tables and some demo data so you can log in immediately.
Run once:  python seed.py
"""
from app import models  # noqa: F401
from app.database import Base, SessionLocal, engine
from app.models import Course, Department, Faculty, Student, Subject, User
from app.utils.security import hash_password


def get_or_create_user(db, email, password, role):
    user = db.query(User).filter_by(email=email).first()
    if not user:
        user = User(email=email, password_hash=hash_password(password), role=role)
        db.add(user)
        db.flush()
    return user


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    get_or_create_user(db, "admin@college.edu", "Admin@123", "admin")

    dept = db.query(Department).filter_by(code="CSE").first()
    if not dept:
        dept = Department(name="Computer Science", code="CSE", description="Department of Computer Science")
        db.add(dept)
        db.flush()

    course = db.query(Course).filter_by(code="MCA").first()
    if not course:
        course = Course(name="MCA", code="MCA", department_id=dept.id, duration="2 Years",
                        description="Master of Computer Applications")
        db.add(course)
        db.flush()

    faculty = db.query(Faculty).filter_by(faculty_id="F001").first()
    if not faculty:
        user = get_or_create_user(db, "faculty@college.edu", "Faculty@123", "faculty")
        faculty = Faculty(faculty_id="F001", name="Dr. Priya Nair", email="faculty@college.edu", phone="9000000001",
                          department_id=dept.id, designation="Assistant Professor", user_id=user.id)
        db.add(faculty)
        db.flush()

    for code, name in (("PY101", "Python Programming"), ("DB101", "Database Systems")):
        if not db.query(Subject).filter_by(code=code).first():
            db.add(Subject(name=name, code=code, course_id=course.id, department_id=dept.id,
                           semester=1, faculty_id=faculty.id))

    demo_students = [("S001", "MCA001", "John Mathew", "john@college.edu"),
                     ("S002", "MCA002", "Anitha Raj", "anitha@college.edu")]
    for sid, roll, name, email in demo_students:
        if not db.query(Student).filter_by(student_id=sid).first():
            user = get_or_create_user(db, email, "Student@123", "student")
            db.add(Student(student_id=sid, roll_number=roll, name=name, email=email, phone="9000000000",
                           department_id=dept.id, course_id=course.id, year=1, semester=1, section="A",
                           user_id=user.id))
    db.commit()
    db.close()
    print("Seed complete.\n  Admin  : admin@college.edu / Admin@123\n  Faculty: faculty@college.edu / Faculty@123"
          "\n  Student: john@college.edu / Student@123")


if __name__ == "__main__":
    main()
