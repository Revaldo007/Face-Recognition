# Facial Recognition-Based Automated Students Attendance Monitoring System

A college mini project: faculty enroll student faces, open a camera in the browser, and attendance is marked
**automatically** when a student's face is recognised. Reports and percentages are available to admin, faculty and students.

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router, Axios (JavaScript) |
| Backend | Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2, Pydantic 2, JWT (PyJWT), bcrypt |
| Database | PostgreSQL |
| Computer vision | OpenCV (YuNet face detector + SFace face embeddings), NumPy |

## Which Python version?

**Use Python 3.12** (you have 3.12 and 3.14).
Python 3.12 has ready-made wheels for every package here (OpenCV, NumPy, psycopg2, bcrypt, pydantic-core), so
`pip install` works without a compiler. Python 3.14 is very new and several scientific packages
(NumPy 2.2, psycopg2-binary builds, etc.) do not all ship 3.14 wheels yet, so installation can fail.
The backend was developed and tested on Python 3.12.
Also needed: **Node.js 20.19+ or 22.12+** (22 LTS recommended) and **PostgreSQL 14+**.

> No `dlib`, no `cmake`, no Visual Studio C++ build tools are needed. Face detection/recognition uses OpenCV's own
> ONNX models (YuNet + SFace), which is why the install is easy on Windows.

---

## 1. Database (PostgreSQL)

Create an empty database (use pgAdmin, or psql):

```sql
CREATE DATABASE attendance_db;
```

## 2. Backend

```bash
cd backend
py -3.12 -m venv venv                 # macOS/Linux: python3.12 -m venv venv
venv\Scripts\activate                 # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env                # macOS/Linux: cp .env.example .env
```

Open `backend/.env` and set your PostgreSQL password in `DATABASE_URL`:

```
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/attendance_db
```

Create tables + demo data, then start the server:

```bash
python seed.py
uvicorn app.main:app --reload
```

* The first start downloads two small face models (~37 MB) into `backend/app/face_models/`. (Needs internet once.
  If your network blocks it, run `python download_models.py` on another network or download the two links printed
  in the error message and save them there as `yunet.onnx` and `sface.onnx`.)
* Swagger docs: <http://127.0.0.1:8000/docs>

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. (Use `localhost` – browsers only allow camera access on `localhost` or HTTPS.)

## 4. Demo logins (created by `seed.py`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@college.edu | Admin@123 |
| Faculty | faculty@college.edu | Faculty@123 |
| Student | john@college.edu | Student@123 |
| Student | anitha@college.edu | Student@123 |

The seed also creates department **CSE**, course **MCA**, subjects **PY101** and **DB101** (Semester 1, assigned to the demo faculty), and 2 students in Section **A**.

## 5. Demo script (Register → Enroll → Attend → Recognise → Report)

1. **Admin** logs in → *Students* → **Add student** (Course MCA, Semester 1, Section A) – e.g. register yourself and a friend with real emails/passwords.
   *(Class = Course + Semester + Section. A session only recognises students of that class.)*
2. **Faculty** logs in → *Face Enrollment* → pick the student → look at the camera → when the box turns green press **Capture & Enroll Face**.
3. *Take Attendance* → choose *Python Programming*, Section **A** → **Start Session**. The camera opens and scans a frame every 2 seconds.
4. Show your face → the student is recognised and marked **PRESENT** (time stored). Show the same face again → *already marked* (no duplicate).
   Show an unenrolled person → **Student Not Recognized**.
5. Click **End Session** → everyone not recognised is stored as **ABSENT** and the absent list is shown.
6. Open *Attendance Records* and *Reports* (Daily / Monthly / Subject-wise / Student). Log in as the **Student** to see their own subject-wise % and history.

## 6. Project structure

```
backend/
  app/
    main.py  config.py  database.py  dependencies.py
    models/     user, student, faculty, department, course, subject, face_data, attendance_session, attendance
    schemas/    Pydantic request/response models
    routers/    auth, students, faculty, departments, courses, subjects, face, attendance, reports
    services/   face_detection.py  face_recognition.py  attendance_service.py
    utils/      security.py (bcrypt + JWT)   helpers.py
    face_models/  (yunet.onnx, sface.onnx – downloaded automatically)
  tests/test_api.py   seed.py   download_models.py   requirements.txt
frontend/
  src/
    components/  Navbar Sidebar Layout ProtectedRoute RoleRoute Camera AttendanceTable CrudPage ui
    pages/       Login, Reports, admin/*, faculty/*, student/*
    context/AuthContext.jsx    services/api.js    App.jsx  main.jsx  index.css
docs/DOCUMENTATION.md          (abstract, diagrams, schema, API, test cases ... for your report)
```

## 7. How it works (short)

```
React <Camera> → JPEG frame → Axios (multipart) → FastAPI /api/attendance/recognize
   → OpenCV YuNet: detect face(s)  → quality checks (size / dark / blur)
   → OpenCV SFace: 128-number embedding → cosine similarity against enrolled students of the class
   → similarity ≥ threshold (0.363)?  yes → attendance_service.mark_present()
                                        no  → "Student Not Recognized" (nothing stored)
   → duplicate check in code + UNIQUE(session_id, student_id) in PostgreSQL
```

* Only the **embedding** (128 float numbers) is stored – not the photo – and it is never returned by any API.
* Recognition threshold is configurable: `FACE_MATCH_THRESHOLD` in `.env` (higher = stricter).
* The backend re-checks the user's role on every protected route (JWT + `require_roles`).

## 8. Development phases → where the code is

| Phase | What | Files |
|---|---|---|
| 1 Setup | FastAPI, PostgreSQL, React+Vite+Tailwind | `backend/app/main.py`, `config.py`, `database.py`, `frontend/vite.config.js`, `index.css` |
| 2 Database | 9 tables with FKs | `backend/app/models/*` |
| 3 Auth | Login, JWT, AuthContext, ProtectedRoute, RoleRoute | `routers/auth.py`, `dependencies.py`, `utils/security.py`, `context/AuthContext.jsx`, `components/ProtectedRoute.jsx`, `RoleRoute.jsx` |
| 4 Admin | Students, Faculty, Departments, Courses, Subjects | `routers/*`, `pages/admin/*`, `components/CrudPage.jsx` |
| 5 Faculty | Dashboard, enrollment, session, camera | `pages/faculty/*`, `components/Camera.jsx` |
| 6 Face recognition | detection, embedding, threshold | `services/face_detection.py`, `face_recognition.py`, `routers/face.py` |
| 7 Attendance | auto marking, duplicates, absent detection | `services/attendance_service.py`, `routers/attendance.py` |
| 8 Student | dashboard, my attendance, profile | `pages/student/*` |
| 9 Reports | daily / monthly / subject / student | `routers/reports.py`, `pages/Reports.jsx` |
| 10 Testing | automated API test + manual checklist | `backend/tests/test_api.py`, `docs/DOCUMENTATION.md` §14 |
| 11 Documentation | report content | `docs/DOCUMENTATION.md` |

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `password authentication failed` | Fix the password in `backend/.env` `DATABASE_URL`. |
| `database "attendance_db" does not exist` | Create it (step 1). |
| Face models could not be downloaded | Check internet / proxy, then `python download_models.py`; or save the two `.onnx` files manually into `backend/app/face_models/`. |
| Camera does not open | Use `http://localhost:5173` (not an IP address), allow the camera permission, close other apps using the camera. |
| Good face but "Student Not Recognized" | Re-enroll in good light (front-facing, no glasses glare). Check the student's Course/Semester/Section match the session. Lower `FACE_MATCH_THRESHOLD` slightly (e.g. 0.30) only if needed. |
| Wrong person recognised | Raise `FACE_MATCH_THRESHOLD` (e.g. 0.45) and re-enroll with better photos. |
| `No enrolled faces found for this class` | Enroll at least one student of that course/semester/section. |
| CORS error | In development the Vite proxy avoids CORS. If you deploy separately, add your frontend URL to `CORS_ORIGINS`. |

## 10. Limitations (be honest in your viva)

* A printed photo or a phone screen may fool the camera – there is no liveness/anti-spoofing check (listed as future work).
* Accuracy depends on lighting, camera quality and how well the face was enrolled.
* Sessions are matched to a class by Course + Semester + Section.
