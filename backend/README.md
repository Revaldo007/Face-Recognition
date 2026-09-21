# Backend – FastAPI

See the main `README.md` in the project root for the full setup guide.

Quick start (Python 3.12):

```bash
python -m venv venv
venv\Scripts\activate          # Windows   (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # macOS/Linux: cp .env.example .env   (then edit DATABASE_URL)
python seed.py                 # creates tables + demo users
uvicorn app.main:app --reload
```

* API docs (Swagger): http://127.0.0.1:8000/docs
* Run the automated test (no camera / PostgreSQL needed): `pip install pytest httpx` then `pytest -q`
* Face models (YuNet + SFace, ~37 MB) download automatically on first start, or run `python download_models.py`.
