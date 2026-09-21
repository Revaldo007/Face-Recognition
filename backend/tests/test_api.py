"""
End-to-end API test (uses SQLite and a FAKE face engine, so it needs no camera,
no PostgreSQL and no model download).  Run:  pytest -q
"""
import os
import tempfile

os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import face_detection as fd
from seed import main as seed_main


# ---- fake face engine: identity is encoded in a coloured block in the image corner ----
def make_image(identity: int | None, faces: int = 1) -> bytes:
    rng = np.random.default_rng(identity or 0)
    img = rng.integers(60, 200, (240, 320, 3), dtype=np.uint8)
    img[:20, :20] = 0 if identity is None else identity * 40
    img[:20, 20:40] = faces * 40
    return cv2.imencode(".jpg", img)[1].tobytes()


def fake_detect(img):
    n = int(round(np.median(img[5:15, 25:35]) / 40))
    return [np.array([60 + 10 * i, 60, 120, 120] + [0] * 11, dtype=np.float32) for i in range(n)]


def fake_embed(img, face):
    ident = int(round(np.median(img[5:15, 5:15]) / 40))
    vec = np.zeros(128, dtype=np.float32)
    vec[ident] = 1.0
    return vec


@pytest.fixture(scope="module")
def client():
    fd.engine.detect = fake_detect
    fd.engine.embed = fake_embed
    seed_main()
    with TestClient(app) as c:
        yield c


def login(client, email, password):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_full_flow(client):
    admin = login(client, "admin@college.edu", "Admin@123")
    faculty = login(client, "faculty@college.edu", "Faculty@123")
    student = login(client, "john@college.edu", "Student@123")

    # bad login
    assert client.post("/api/auth/login", json={"email": "admin@college.edu", "password": "x"}).status_code == 401
    assert client.get("/api/students").status_code == 401                       # no token
    assert client.get("/api/students", headers=student).status_code == 403     # wrong role
    assert client.post("/api/departments", headers=faculty, json={"name": "X", "code": "X"}).status_code == 403

    me = client.get("/api/auth/me", headers=faculty).json()
    assert me["role"] == "faculty" and me["name"].startswith("Dr.")

    # admin: stats + student CRUD + uniqueness
    stats = client.get("/api/reports/dashboard", headers=admin).json()
    assert stats["students"] == 2 and stats["subjects"] == 2
    students = client.get("/api/students", headers=admin).json()
    john, anitha = students[0], students[1]
    dup = {**{k: john[k] for k in ("student_id", "roll_number", "name", "department_id", "course_id", "year", "semester", "section")},
           "email": "new@college.edu", "password": "secret1"}
    assert client.post("/api/students", headers=admin, json=dup).status_code == 409   # duplicate student_id
    new = {**dup, "student_id": "S003", "roll_number": "MCA003", "name": "Third Student"}
    r = client.post("/api/students", headers=admin, json=new)
    assert r.status_code == 201
    third = r.json()
    assert client.get("/api/students?search=Third", headers=admin).json()[0]["name"] == "Third Student"
    assert client.put(f"/api/students/{third['id']}", headers=admin, json={"phone": "123"}).json()["phone"] == "123"
    assert "face_embedding" not in third
    # student can only see own profile
    assert client.get(f"/api/students/{john['id']}", headers=student).status_code == 200
    assert client.get(f"/api/students/{anitha['id']}", headers=student).status_code == 403

    # face enrollment: John=1, Anitha=2  (Third stays un-enrolled)
    for st, ident in ((john, 1), (anitha, 2)):
        r = client.post(f"/api/face/enroll/{st['id']}", headers=faculty,
                        files=[("images", ("a.jpg", make_image(ident), "image/jpeg"))] * 3)
        assert r.status_code == 200, r.text
    assert client.get(f"/api/face/status/{john['id']}", headers=faculty).json()["enrolled"] is True
    assert client.get(f"/api/face/status/{third['id']}", headers=faculty).json()["enrolled"] is False
    r = client.post(f"/api/face/enroll/{john['id']}", headers=faculty, files=[("images", ("a.jpg", make_image(1, faces=0), "image/jpeg"))])
    assert r.status_code == 422 and "No face" in r.json()["detail"]
    r = client.post(f"/api/face/enroll/{john['id']}", headers=faculty, files=[("images", ("a.jpg", make_image(1, faces=2), "image/jpeg"))])
    assert r.status_code == 422 and "Multiple" in r.json()["detail"]
    r = client.post(f"/api/face/enroll/{john['id']}", headers=faculty, files=[("images", ("a.jpg", b"not an image", "image/jpeg"))])
    assert r.status_code == 422 and "Invalid" in r.json()["detail"]

    # session
    subjects = client.get("/api/subjects", headers=faculty).json()
    py = next(s for s in subjects if s["code"] == "PY101")
    r = client.post("/api/attendance/session", headers=faculty, json={"subject_id": py["id"], "section": "a"})
    assert r.status_code == 201
    session = r.json()
    assert session["total_students"] == 3 and session["status"] == "active"

    def recognize(ident, faces=1):
        r = client.post("/api/attendance/recognize", headers=faculty, data={"session_id": session["id"]},
                        files={"image": ("f.jpg", make_image(ident, faces), "image/jpeg")})
        assert r.status_code == 200, r.text
        return r.json()

    r = recognize(1)
    assert r["faces"][0]["status"] == "PRESENT" and r["faces"][0]["student"]["name"] == "John Mathew"
    r = recognize(1)                                            # duplicate
    assert r["faces"][0]["status"] == "ALREADY_MARKED" and r["present_count"] == 1
    r = recognize(5)                                            # unknown face
    assert r["faces"][0]["status"] == "NOT_RECOGNIZED" and r["present_count"] == 1
    r = recognize(None, faces=0)
    assert "No face detected" in r["message"]
    assert recognize(2)["present_count"] == 2

    # close -> absent detection
    r = client.post(f"/api/attendance/session/{session['id']}/close", headers=faculty).json()
    assert r["status"] == "closed" and r["present_count"] == 2 and r["absent_count"] == 1
    assert r["absent"][0]["name"] == "Third Student" and r["percentage"] == 66.7
    r = client.post("/api/attendance/recognize", headers=faculty, data={"session_id": session["id"]},
                    files={"image": ("f.jpg", make_image(1), "image/jpeg")})
    assert r.status_code == 409                                  # closed session

    # second class where John is absent
    s2 = client.post("/api/attendance/session", headers=faculty, json={"subject_id": py["id"], "section": "A"}).json()
    client.post("/api/attendance/recognize", headers=faculty, data={"session_id": s2["id"]},
                files={"image": ("f.jpg", make_image(2), "image/jpeg")})
    client.post(f"/api/attendance/session/{s2['id']}/close", headers=faculty)

    # reports
    daily = client.get("/api/reports/daily", headers=faculty).json()["rows"]
    assert len(daily) == 2 and daily[0]["total_students"] == 3
    rep = client.get(f"/api/reports/student/{john['id']}", headers=student).json()
    row = next(s for s in rep["subjects"] if s["code"] == "PY101")
    assert (row["classes"], row["present"], row["absent"], row["percentage"]) == (2, 1, 1, 50.0)
    assert client.get(f"/api/reports/student/{anitha['id']}", headers=student).status_code == 403
    sub = client.get(f"/api/reports/subject/{py['id']}", headers=faculty).json()
    assert sub["classes_conducted"] == 2
    assert next(s for s in sub["students"] if s["name"] == "Anitha Raj")["percentage"] == 100.0
    month = client.get("/api/reports/monthly", headers=admin).json()
    assert month["summary"]["sessions"] == 2 and month["subjects"][0]["subject"] == "Python Programming"
    today = client.get("/api/reports/dashboard", headers=admin).json()["today"]
    assert today["sessions"] == 2 and today["present"] == 3

    # deleting a course in use is refused; deleting a student removes face data + attendance
    assert client.delete(f"/api/courses/{py['course_id']}", headers=admin).status_code == 409
    assert client.delete(f"/api/students/{john['id']}", headers=admin).status_code == 204
    assert client.post("/api/auth/login", json={"email": "john@college.edu", "password": "Student@123"}).status_code == 401
