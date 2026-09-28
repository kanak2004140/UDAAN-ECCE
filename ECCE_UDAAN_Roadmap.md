# ECCE / UDAAN Project Roadmap

Each phase is scoped to be finishable in one focused session. Check them off as you go.

## ✅ Completed

- [x] **Phase 0 — Architecture & stack decision.** FastAPI + PostgreSQL + SQLAlchemy + Alembic backend, Next.js frontend, `Next.js → FastAPI → PostgreSQL` (frontend never touches the DB directly).
- [x] **Phase 1 — Core database schema.** All 15 models built: User, Child, Language, ChildGuardian, ChildLanguage, Curriculum, Subject, Topic, LearningObject, Activity, ActivityContent, ContentVariant, LearningSession, ActivityAttempt, LearningProgress.
- [x] **Phase 2 — Alembic migrations.** All applied and working against PostgreSQL.
- [x] **Phase 3 — FastAPI core.** App, DB connection, CORS, health/root endpoints.
- [x] **Phase 4 — Auth system.** Register/login, password hashing, JWT (now with expiration), self-only profile access.
- [x] **Phase 5 — Core API routers.** Children, Activities, Activity Contents, Content Variants, Learning Objects, Learning Sessions, Activity Attempts, Learning Progress — all with correct per-user ownership checks and FK validation.
- [x] **Phase 6 — Dev/demo seed data.** Idempotent seed scripts, correctly structured per age group (no more cross-age-group data bleed).
- [x] **Phase 7 — Frontend scaffolding.** Landing page (Hero, Features, Age Worlds, Parent Section, Navbar), login/signup flow.
- [x] **Phase 8 — Learning worlds & activity flow.** 2-4 / 4-6 / 6-8 pages, each with a working session → activity → attempt → progress pipeline, wired end-to-end to the real API.
- [x] **Phase 9 — Bug-hardening pass.** Security fixes (unauthenticated profile leak, spoofable child data, FK validation), race conditions (duplicate child/session), dead UI cleanup, real speech synthesis, persisted progress from the database instead of fake/reset-on-refresh state.

**Where this leaves you:** the platform itself — accounts, children, sessions, activities, and progress tracking — is functionally complete and reasonably hardened, running on your local machine with demo data.

## ⏳ Remaining phases

### Getting it live
- [ ] **Phase 10 — Deploy the database.** Move Postgres to Neon (or similar). *(Already scoped out — just needs executing.)*
- [ ] **Phase 11 — Deploy the backend.** Get FastAPI running somewhere always-on (Render/Railway/VPS), pointed at the Phase 10 database.
- [ ] **Phase 12 — Deploy the frontend.** Get Next.js live (Vercel is the natural fit), pointed at the Phase 11 backend via `NEXT_PUBLIC_API_URL`.
- [ ] **Phase 13 — End-to-end smoke test on the live deployment.** Register a real account, complete one activity per age group, confirm data lands correctly in the deployed database.

### NCERT content (paused earlier — pick up when ready)
- [ ] **Phase 14 — `ContentSource` model + migration.** The table that tracks every ingested resource: source URL, publisher, license, file hash, attribution — before any real content touches it.
- [ ] **Phase 15 — First manual ingestion (proof of concept).** You/Kanak manually download one official NCERT chapter PDF; build the script that hashes it, extracts text, and stores it against `ContentSource` untouched otherwise.
- [ ] **Phase 16 — Age-group classification for that first resource.** Manual/rule-based mapping only (no AI/ML yet) — decide which age band the content belongs to, with a "needs review" path for anything uncertain.
- [ ] **Phase 17 — Wire ingested content into the real hierarchy.** Map the classified content into `Topic → LearningObject → Activity → ActivityContent`, so it shows up through the existing API and frontend exactly like the seed data does now.
- [ ] **Phase 18 — Repeat Phases 15-17 for a second and third resource.** Confirms the pipeline actually generalizes before scaling further.

### Product improvements (lower priority, do anytime)
- [ ] **Phase 19 — Per-activity progress granularity.** Currently 4-6 and 6-8 share one `LearningObject` across all their activities, so progress can't distinguish "completed Shapes" from "completed Triangles specifically." Needs either a schema change or splitting into separate learning objects like 2-4 already has.
- [ ] **Phase 20 — AI/ML content classification.** Only after Phase 16-18 prove the manual/rule-based version works — replace manual classification with a real classifier, still gated by a review queue for low-confidence results.
- [ ] **Phase 21 — Multilingual content at scale.** `ContentVariant` already supports this structurally — this phase is about actually populating multiple languages once there's real content to translate.
- [ ] **Phase 22 — Offline learning support.** Explicitly deferred in your original scope; revisit once the online experience is solid end-to-end.

## Rough completion estimate

- **Core platform (backend + frontend, demo data):** ~90% done.
- **Full original scope (platform + live NCERT content + AI/ML + multilingual + offline + deployed):** roughly **40-45%** done — the biggest remaining chunks are deployment (Phases 10-13) and the NCERT pipeline (Phases 14-18), both of which are now clearly scoped into small pieces above.
