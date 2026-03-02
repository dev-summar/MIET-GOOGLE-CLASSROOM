# Classroom Insights Backend (Node.js)

Express + MongoDB Atlas + Google Classroom API. Run from this directory.

## Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set `MONGODB_URI` (MongoDB Atlas only; localhost is rejected)
   - Set `GOOGLE_APPLICATION_CREDENTIALS=service-account.json`
   - Place `service-account.json` in the `backend` folder
   - Set `GOOGLE_IMPERSONATED_USER=admin@domain.com`
   - Optional: `FRONTEND_ORIGIN=http://localhost:5173`, `SYNC_FROM_YEAR=2025`

3. **Run**
   ```bash
   npm start
   ```
   Or `npm run dev` for watch mode.

API base: `http://localhost:8000/api`

## Testing with Postman

1. **Start the server** (from `backend` folder):
   ```bash
   npm start
   ```

2. **Import the collection**
   - Open Postman → **Import** → choose `backend/postman/Classroom-Insights-API.postman_collection.json`
   - The collection uses variable `baseUrl` = `http://localhost:8000/api`

3. **Suggested order**
   - **Health check** — `GET /api/health` — confirms server is up (no DB/auth).
   - **Debug → Auth status** — `GET /api/debug/auth-status` — checks Google credentials.
   - **Debug → DB status** — `GET /api/debug/db-status` — checks MongoDB connection.
   - **Debug → DB source** — `GET /api/debug/db-source` — collection counts.
   - **Clear DB** (optional) — `POST /api/debug/clear-db` — empty all collections for a fresh start; then run **Sync all**.
   - **Sync all** — `POST /api/sync/all` — run once to pull data from Classroom (needs valid Google + DB).
   - **Stats** — `GET /api/stats` — then **Courses**, **Students**, **Teachers**, **Assignments**, **Silent students**, **At-risk students** as needed.

4. **Detail requests**
   - **Course by ID**: set path variable `courseId` to an id from the courses list.
   - **Assignment by ID**: set path variable `id` to an assignment id from the assignments list.

List endpoints accept query params: `page`, `limit`, `search` (case-insensitive).

## Startup rules

- Refuses to start if `MONGODB_URI` is missing or contains `localhost` / `127.0.0.1`
- Refuses to start if the credentials file is missing

## API (all under `/api`)

- `POST /api/sync/all` — full sync (courses ≥ SYNC_FROM_YEAR, then coursework, submissions; cache invalidated)
- `GET /api/stats` — counts (courses, students, teachers, assignments, submissions)
- `GET /api/courses`, `GET /api/courses/:courseId`
- `GET /api/students`, `GET /api/teachers`, `GET /api/assignments`, `GET /api/assignments/:id`
- `GET /api/silent-students`, `GET /api/at-risk-students`
- `GET /api/debug/auth-status`, `GET /api/debug/db-status`, `GET /api/debug/db-source`, `POST /api/debug/clear-db`

Query params for list endpoints: `page`, `limit`, `search` (case-insensitive).
