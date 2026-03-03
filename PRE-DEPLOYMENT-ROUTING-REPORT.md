# PRE-DEPLOYMENT ROUTING REPORT

**Generated:** Pre-deployment audit (API + TLC + React SPA)  
**Scope:** Backend routes, TLC external calls, Axios, React Router, Vite base, SPA refresh, subpath, build, CORS.

---

## Summary

| Check | Status |
|-------|--------|
| Backend API Prefixing | **OK** |
| TLC External Routing | **OK** (minor: hardcoded URL in frontend) |
| Axios BaseURL | **Issue** (localhost fallback) |
| React Router Basename | **OK** |
| Vite Base Config | **OK** |
| SPA Refresh Safe | **YES** |
| Subpath Ready | **YES** |
| Localhost References | **FOUND** (see below) |
| CORS Risk | **LOW** |

---

## Phase 1 — Backend Route Structure

### Route mount points

- `app.get('/api/health', ...)` — health check (explicit)
- `app.use('/api', syncRoutes)` → `/api/sync/all` (POST)
- `app.use('/api', statsRoutes)` → `/api/stats` (GET)
- `app.use('/api', coursesRoutes)` → `/api/courses`, `/api/courses/:courseId`
- `app.use('/api', studentsRoutes)` → `/api/students`
- `app.use('/api', teachersRoutes)` → `/api/teachers`
- `app.use('/api', assignmentsRoutes)` → `/api/assignments`, `/api/assignments/:id`
- `app.use('/api', analyticsRoutes)` → `/api/silent-students`, `/api/at-risk-students`, `/api/submissions-over-time`, `/api/at-risk-trend`
- `app.use('/api', debugRoutes)` → `/api/debug/auth-status`, `/api/debug/db-status`, `/api/debug/db-source`, `/api/debug/clear-db` (POST)
- `app.use('/api/tlc', tlcRoutes)` → `/api/tlc/courses`, `/api/tlc/courses/:subjectId`, `/api/tlc/refresh` (POST)

### Confirmations

- All backend routes are under `/api` (including health and debug). **OK**
- No route mounted at `/` (root). **OK**
- No wildcard `*` on backend. **OK**
- No duplicate path registrations. **OK**
- Backend does **not** serve frontend static files (no `express.static`, no `sendFile`). **OK**
- Backend does not depend on frontend routing. **OK**

---

## Phase 2 — TLC External Routing (Frontend Direct)

### Locations

- `frontend/src/pages/TlcCourseList.jsx` — `axios.get('https://pi360.net/site/api/endpoints/api_tlc_content.php', ...)`
- `frontend/src/pages/TlcCourseDetail.jsx` — same URL + `api_tlc_content_details.php`
- Backend: `backend/src/services/tlcService.js` — `TLC_BASE_URL` from env (default `https://pi360.net/site/api/endpoints`)

### Confirmations

- TLC calls use `https://pi360.net/site/api/endpoints/...`. **OK** (HTTPS only)
- No mixed content (HTTP). **OK**
- Error handling: `TlcCourseList` and `TlcCourseDetail` use `try/catch`, `ErrorMessage`, `setError`. **OK**
- Loading state: both use `loading` / `Spinner`. **OK**
- App does not crash if TLC fails (error state + optional materials fetch in detail). **OK**
- TLC frontend calls are **not** prefixed with `/api` (they go to pi360.net). **OK**
- Backend has `/api/tlc/*` (proxy/cache endpoints); frontend TLC pages call pi360.net directly. No conflict. **OK**

---

## Phase 3 — Axios Internal API

- **Instance:** `frontend/src/api/axios.js`
- **baseURL:** `import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'`
- **Issue:** Fallback is hardcoded localhost. If `VITE_API_BASE_URL` is unset in production build, the bundle will use `http://localhost:8000/api`.
- **Internal usage:** All internal API usage goes through this instance with relative paths (`/stats`, `/sync/all`, `/courses`, etc.). **OK**
- **Recommendation:** Use a production-safe fallback (e.g. relative `/api` or require env in production). See fix below.

### Localhost / 127.0.0.1 in project

- `backend/src/index.js` — console message only (dev). **Acceptable**
- `backend/src/app.js` — `FRONTEND_ORIGIN` default `http://localhost:5173` (override in prod). **Acceptable**
- `backend/postman/*` — dev test collection. **Acceptable**
- `frontend/src/api/axios.js` — fallback `http://localhost:8000/api`. **Issue for production**
- `frontend/vite.config.js` — dev proxy `target: 'http://localhost:8000'`. **Dev only, OK**
- `backend/README.md`, `backend/src/config/env.js` — docs and validation (reject localhost in MONGODB_URI). **OK**

---

## Phase 4 — React Router SPA

- **Router:** `BrowserRouter` with `basename={import.meta.env.VITE_BASE_PATH || '/'}` in `App.jsx`. **OK**
- **Routes:**
  - `/` (index) → Dashboard
  - `courses`, `courses/:id`
  - `students`, `teachers`
  - `assignments`, `assignments/:id`
  - `silent-students`, `at-risk-students`
  - `tlc-courses`, `tlc-courses/:id`
  - `*` → `<Navigate to="/" replace />`
- No duplicate or overlapping route definitions. **OK**
- Navigation uses `<Link>`, `<NavLink>`, or `navigate()` (no full reload). **OK**

---

## Phase 5 — Vite Base Path

- **Config:** `frontend/vite.config.js` — `base: process.env.VITE_BASE_PATH ?? '/'`
- Supports root (`/`) and subpath (e.g. `VITE_BASE_PATH=/classrooms/`). **OK**
- No absolute `/assets` references in source. **OK**
- For subpath deploy: run build with `VITE_BASE_PATH=/classrooms/` (or equivalent) so `index.html` and assets use the prefix.

---

## Phase 6 — SPA Refresh Safety

- All listed routes (`/courses`, `/teachers`, `/tlc-courses`, `/assignments/123`, `/tlc-courses/4025`) are React Router paths under the same `Layout`; no hash routing.
- Server must serve `index.html` for all non-file SPA paths (rewrite/fallback). With that in place, refresh on any of these URLs is **compatible**.
- No code assumes hash routing or breaks when URL has a subpath prefix (basename is used consistently). **OK**

---

## Phase 7 — Subpath Deployment

- Ready for `https://domain.com/classrooms/`:
  - Build with `VITE_BASE_PATH=/classrooms/` (trailing slash per Vite convention).
  - All links use React Router `to="/..."`; with `basename="/classrooms/"` they resolve to `/classrooms/...`. **OK**
  - No absolute `/api` in frontend (API base comes from `VITE_API_BASE_URL`, typically same-origin or full URL). **OK**
  - No hardcoded root `/` navigation that ignores basename (all via React Router). **OK**
  - No `window.location.pathname` assumptions found. **OK**

---

## Phase 8 — Production Build Scan

- `npm run build` completed successfully.
- **dist/index.html:** Script/style use absolute paths from root (`/assets/...`). Correct when `base` is `/`. For subpath, rebuild with `VITE_BASE_PATH` set.
- **dist/assets/*.js:** No `:8000` in built output. Possible localhost substring from minified code (e.g. “header-logo”); main risk is axios fallback if env is unset (see Phase 3).
- **Recommendation:** Set `VITE_API_BASE_URL` (and optionally `VITE_BASE_PATH`) at build time for production so the bundle has no localhost API URL.

---

## Phase 9 — CORS & Mixed Request Safety

- **Backend:** `cors({ origin: frontendOrigin, credentials: true, ... })` with `frontendOrigin = getEnv('FRONTEND_ORIGIN', 'http://localhost:5173')`.
- Single-origin allowlist; no wildcard in production if `FRONTEND_ORIGIN` is set to the real frontend URL. **OK**
- TLC calls are to pi360.net (cross-origin). Browser CORS is determined by pi360.net; no CORS config in this repo. **Acceptable** (external service).
- No insecure `http` resources for app origin; TLC uses HTTPS. **OK**

---

## Phase 10 — Routing Readiness Summary

```
PRE-DEPLOYMENT ROUTING REPORT
=============================

Backend API Prefixing:    OK
TLC External Routing:     OK
Axios BaseURL:            Issue (localhost fallback)
React Router Basename:    OK
Vite Base Config:         OK
SPA Refresh Safe:         YES
Subpath Ready:            YES
Localhost References:     FOUND (axios fallback; backend/postman/vite dev defaults)
CORS Risk:                LOW

Recommended Fixes:
------------------
1. Axios (frontend): Use a production-safe default for baseURL so that if
   VITE_API_BASE_URL is unset, the app uses relative "/api" (same-origin)
   instead of http://localhost:8000/api. Alternatively, require
   VITE_API_BASE_URL in production builds.

2. Production env: Set FRONTEND_ORIGIN to the real frontend origin (e.g.
   https://domain.com or https://domain.com/classrooms) so CORS is correct.

3. Subpath deploy: Build with VITE_BASE_PATH=/classrooms/ (or your subpath)
   and configure the server to rewrite SPA routes to index.html and to serve
   assets from the same subpath.

4. Optional: Move TLC base URL to an env variable (e.g. VITE_TLC_BASE_URL) in
   the frontend for flexibility, while keeping https://pi360.net/... as default.
```

---

*End of report. No business logic was changed; audit focused only on routing, deployment safety, and request flow.*
