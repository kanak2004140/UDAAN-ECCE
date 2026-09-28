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
| 2-4 years | `/learn/2-4` |
| 5-6 years | `/learn/4-6` |
| 7-8 years | `/learn/6-8` |

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

Passwords are stored as hashes, never as plain text.

## Migrations

Alembic manages all schema changes. Current migration head:

```text
c8d3e5f7a012
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

Future work includes:

- Real answer-selection and answer-evaluation interfaces.
- Matching, sorting, counting, quizzes, and drag-and-drop activities.
- Regional-language content and audio.
- Voice-first learning.
- Offline content packages and synchronization.
- AI recommendations and adaptive difficulty.
- AR and computer-vision activities.
- Parent and teacher progress dashboards.

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
