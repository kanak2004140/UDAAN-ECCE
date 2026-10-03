# ECCE eTools

ECCE eTools is an age-aware early-childhood learning platform prototype for children ages 2-8. It connects a Next.js frontend to a FastAPI backend and PostgreSQL database.

## Project Architecture

```text
Next.js frontend
      |
      v
Typed API client
      |
      v
FastAPI REST API
      |
      v
SQLAlchemy
      |
      v
PostgreSQL
```

## Implemented Features

### User Authentication

- User registration and login.
- Secure password hashing with Werkzeug.
- JWT access tokens with PyJWT.
- Protected child, session, attempt, and progress routes.
- CORS configured for local frontend development.
- User email, role, and date of birth stored in PostgreSQL.

### Automatic Age Grouping

Age is calculated from the date of birth at registration and login.

| Calculated age | Learning world |
| --- | --- |
| 2-3 years | `/learn/2-4` |
| 4-5 years | `/learn/4-6` |
| 6-8 years | `/learn/6-8` |

Child registrations outside the 2-8 year range are rejected. Future dates of birth are also rejected.

### Learning Structure

The database represents the learning hierarchy as:

```text
Curriculum
  -> Subject
    -> Topic
      -> Learning Object
        -> Activity
          -> Activity Content
            -> Content Variant
              -> Language
```

### Activities

Activities are stored in PostgreSQL and use JSONB configuration for activity-specific data. Current demo activities include:

- Identify the Animal for ages 2-4.
- Sort the Shapes for ages 4-6.
- Count the Stars for ages 6-8.

Activity content and language variants are loaded through the API. The actual media files are represented by content identifiers such as `content_key`.

### Sessions, Attempts, and Progress

The learning flow is connected to PostgreSQL:

```text
Authenticated user
      -> Child profile
        -> Learning session
          -> Activity attempt
            -> Learning progress
```

The system can:

- Create a child associated with the authenticated user.
- Create a learning session.
- Record an activity attempt.
- Mark an activity as completed.
- Update mastery level and attempt counters.
- Store the last attempted time.

## Backend API

Important routes include:

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/users/register` | Register a user and return a JWT |
| POST | `/users/login` | Authenticate a user and return a JWT |
| GET | `/users/{user_id}` | Get a user |
| POST | `/children` | Create an authenticated user's child |
| GET | `/children/{child_id}` | Get an owned child |
| GET | `/activities` | List active activities |
| GET | `/activities/{activity_id}` | Get one activity |
| GET | `/activities/{activity_id}/contents` | Load activity content |
| GET | `/activity-contents/{id}/variants` | Load language variants |
| POST | `/learning-sessions` | Start a learning session |
| GET | `/learning-sessions/{id}` | Get an owned session |
| POST | `/activity-attempts` | Store an activity attempt |
| GET | `/activity-attempts/session/{id}` | Get session attempts |
| POST | `/learning-progress` | Create or update progress |
| GET | `/learning-progress/child/{id}` | Get child progress |
| GET | `/topics` | List topics (filter by `age_group`, `subject_id`) |
| GET | `/topics/{topic_id}` | Get one topic |
| GET | `/languages` | List active languages |
| GET | `/content-sources` | List approved NCERT source chapters (authenticated) |
| POST | `/lessons/generate` | Generate a lesson for a topic from approved NCERT text (authenticated) |
| GET | `/health` | Check API and database health |

Interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

## Frontend Routes

```text
/
/login
/signup
/learn/2-4
/learn/4-6
/learn/6-8
```

The frontend uses a centralized API client in `frontend/lib/api/client.ts`. The client reads the backend URL from `frontend/.env.local` and automatically attaches the stored JWT to authenticated requests.

## Database

Database: `ecce_db`

Important tables:

- `users`
- `children`
- `languages`
- `child_guardians`
- `child_languages`
- `curriculums`
- `subjects`
- `topics`
- `learning_objects`
- `activities`
- `activity_contents`
- `content_variants`
- `learning_sessions`
- `activity_attempts`
- `learning_progress`
- `content_sources` (one row per ingested NCERT chapter)
- `content_chunks` (retrievable text chunks with embeddings)

Passwords are stored as hashes, never as plain text.

## NCERT Content

Official NCERT Class 1-4 textbooks are downloaded per language and stored by book:

```text
content/ncert/
  English/
    Maths Mela (Class 3)/
      cemm101.pdf      original download (kept out of git, see below)
      cemm101.txt      text extracted from that PDF
      manifest.json    chapters, source URLs and the SHA-256 of every PDF
    Mridang (Class 1)/
  Hindi/
  Marathi/
```

Run from `backend/` with the virtual environment active:

```powershell
python -m app.ingestion.ingest_wave --languages English --dry-run   # which book codes are live
python -m app.ingestion.ingest_wave --languages English             # download + extract text
python -m app.ingestion.chunk_and_embed                             # chunk + multilingual embeddings
python -m app.ingestion.organize_content --apply                    # curriculum > subject > topic + age band
python -m app.ingestion.organize_content --approve --book-code cemm1   # only after reviewing the text
python -m app.ingestion.organize_files                              # tidy folders, refresh manifests
```

The PDFs are listed in `.gitignore`: English Class 1-4 alone is about 1 GB, and all 23 languages
would be tens of GB, which GitHub and the deployment builds cannot handle well. The extracted text
and the manifests are committed. To restore the PDFs on another machine, re-run `ingest_wave` and
compare each file with the SHA-256 in its book's `manifest.json`.

Ingested content is never served to children until it has been reviewed and approved
(`review_status = approved`).

## Migrations

Alembic manages all schema changes. Current migration head:

```text
f5b4ccfa61cc
```

Apply migrations with the existing backend virtual environment:

```powershell
cd D:\ECCE\backend
.\venv\Scripts\activate
alembic upgrade head
```

## Local Setup

### Backend

Use the existing virtual environment in `backend\venv`:

```powershell
cd D:\ECCE\backend
.\venv\Scripts\activate
python -m pip install -r ..\requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

### Frontend

Open a second terminal:

```powershell
cd D:\ECCE\frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:3000
```

Frontend configuration is stored in `frontend/.env.local`:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Presentation Demo

1. Open `/signup`.
2. Register with a valid email, password, role, and date of birth.
3. Show that the backend calculates age and assigns the learning world.
4. Show the user record in pgAdmin.
5. Log in with the registered email and password.
6. Open the assigned learning world.
7. Select an activity.
8. Start a learning session.
9. Mark the activity complete.
10. Show the child, session, attempt, and progress records in pgAdmin.
11. Use `/docs` as a backup demonstration of the backend API.

## Current Prototype Scope

The project currently demonstrates the complete age-aware data and persistence foundation. The current activity completion control records completion and progress, but the activities are not yet full interactive games with answer evaluation.

Phased future work (full detail in `ECCE_UDAAN_Roadmap.md`):

- **Deployment (Phases 10-13):** move the database to Neon, deploy the backend (Render/Railway/VPS) and frontend (Vercel), then smoke-test the live stack.
- **NCERT content & AI tutor pipeline (Phases 14-23):** scrape and ingest real NCERT-sourced material into `ContentSource`, chunk and embed it with `pgvector`, classify it by age band/topic, and retrieve + generate lessons via RAG. Ages 4-8 get generated text/speech lessons; ages 2-4/2-6 get a language-independent pre-generated video paired with a per-language narration script read aloud by on-device offline TTS. The assistant switches between live generation (online) and cached video + local TTS (offline).
- **Frontend track (Phases 14F-21F):** build the missing pieces the current frontend doesn't have yet — shared app state, an age-differentiated topic picker, a real generated-lesson renderer, a video/script player, a language picker, genuinely offline-capable TTS, and connectivity-aware caching (service worker/IndexedDB) — each paired with its corresponding backend phase above.
- **Product improvements (Phases 24-27, lower priority):** per-activity progress granularity, an AI/ML classifier upgrade once the manual version proves out, multilingual content at scale, and broader offline hardening beyond content serving.
- Matching, sorting, counting, quizzes, and drag-and-drop activity types; AR/computer-vision activities; parent and teacher progress dashboards remain unscoped beyond this list.

## Validation

The implementation has been checked with:

- Frontend production build using `npm run build`.
- Backend Python compilation checks.
- Alembic migration checks.
- Live API health checks.
- Authentication request checks.
- Authenticated child and session creation.
- Activity attempt persistence.
- Learning progress persistence.

## Development Notes

- Use the existing `backend\venv`; do not create another virtual environment.
- Keep `frontend/package-lock.json` as the frontend lockfile.
- Do not use `Base.metadata.create_all()` for schema changes.
- Create and review Alembic migrations for database changes.
- Keep media files outside PostgreSQL and store media identifiers in content records.
- Keep multilingual content language-aware through `content_variants` and `languages`.
