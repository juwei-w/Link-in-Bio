<!-- Auto-generated TODO summary for developer handoff -->

# Project TODO & Inventory — Link-Sharing / Profile Platform

This file summarizes: (A) what is implemented, (B) remaining work and priorities, and (C) an inventory of key files with their role.

---

**Status Snapshot**

- **Backend:** Core API implemented (signup/login JWT, links CRUD, click tracking, user profile). Firebase Admin integration present but requires env config. MongoDB connection present and works when `MONGODB_URI` is set.
- **Frontend:** Angular SPA with Firebase client auth flows (email/password, Google/GitHub popup). Auth service exchanges Firebase ID tokens with backend. Link management UI and public profile components exist.
- **Docs:** `docs/dev/SETUP.md`, `docs/dev/PRD.md`, `docs/dev/TODO.md`, and `docs/dev/ISSUES-MVP.md` are present and mostly up to date.

---

**What Has Been Done (MVP core)**

- Email/password signup (`POST /api/auth/signup`) and login (`POST /api/auth/login`) implemented in backend.
- JWT generation and protected routes middleware implemented (`backend/middleware/auth.js`).
- Links CRUD API and click-tracking implemented (`backend/routes/links.js`).
- Public profile endpoint and profile fetching exists (`/api/profile/:username`).
- Frontend Angular services for auth and links implemented (`auth.service.ts`, `links.service.ts`).
- OpenAPI basic spec and Swagger UI wiring present (`backend/openapi.json`, exposed at `/docs`).

---

**Recent Changes (implemented in this branch)**

- Backend: added forgot/reset password endpoints with Nodemailer support (MailHog-friendly defaults).

  - Files: `backend/routes/auth.js`, `backend/package.json` (added `nodemailer`), `backend/firebaseAdmin.js` (no functional change), `backend/.env` (recommendation documented).
  - Behavior: `POST /api/auth/forgot` generates a token + expiry and emails a reset link. `POST /api/auth/reset` validates token and sets new password.

- Backend: enforce password-history policy to prevent reusing recent passwords.

  - Files: `backend/models/User.js` (added `passwordHistory` array), `backend/routes/auth.js` (reset logic now checks current + last N hashes, pushes previous hash into history).
  - Config: `PASSWORD_HISTORY_LIMIT` env var controls how many previous passwords are blocked (defaults to `5`). Set to `0` to keep full history behavior (see notes below).

- Frontend: added `Forgot` and `Reset` components and UI, and wired MailHog-friendly reset flow.

  - Files: `frontend/src/app/features/auth/forgot/*`, `frontend/src/app/features/auth/reset/*`, plus `auth.service.ts` methods `forgotPassword()` and `resetPassword()`.

- Frontend: UI polish and consistency updates across auth pages:

  - Inset password visibility toggle (eye icon) blended inside inputs for `login`, `signup`, and `reset` pages.
  - Standardized input height, padding, border-radius, and primary button gradient.
  - Files: `frontend/src/app/features/auth/*/*.css` (notable: `login.component.css`, `signup.component.css`, `reset.component.css`).

- Frontend: created `DemoComponent` and `/demo` route (small demo page for unauthenticated preview).

- Removed GitHub OAuth/code paths and UI elements (GitHub signup/login removed from frontend and backend config).

## Notes: These edits were implemented on branch `Lai` and can be reviewed file-by-file in the repo.

**High-priority Remaining Work (recommended order)**

1. Environment & Secrets (critical)
   - Ensure backend `.env` is present and loaded (contains `MONGODB_URI`, `JWT_SECRET`, `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`).
   - Confirm `serviceAccountKey.json` path or set `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env` for CI/deploy.
2. Firebase Auth verification & OAuth checks
   - Confirm Firebase Console: enable Google/GitHub sign-in and add `localhost:4200` to Authorized domains.
   - Test `/api/auth/firebase` flow end-to-end; the backend must initialize Firebase Admin to verify ID tokens.
3. Secure secrets handling
   - Do not commit production service account keys. Use secret management for deployments (Render/Vercel/Render secret variables).
4. Tests & CI
   - Add unit/integration tests for auth and links; add a GitHub Actions workflow.
5. Email verification/password reset
   - Integrate Firebase flows if required by product decisions.

---

**Medium / Nice-to-have**

- Improve frontend error handling and surface backend errors to the user during OAuth flows.
- Add reserved-username check and a small list (`admin`, `support`, `api`, `www`) to avoid collisions.
- Harden rate-limiting and validation for public endpoints.

---

**Key Files Inventory (what each file does)**

- `backend/`

  - `server.js` — Express app bootstrap, dotenv load, route mounting, MongoDB connect, swagger docs.
  - `config/db.js` — Mongoose connection helper (exports `connect(uri)`).
  - `firebaseAdmin.js` — Initializes Firebase Admin SDK using `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON`.
  - `middleware/auth.js` — JWT verification middleware for protected routes.
  - `models/User.js` — Mongoose User schema (username rules, email, provider fields).
  - `models/Link.js` — Mongoose Link schema (title, url, order/position, clicks).
  - `routes/auth.js` — Auth endpoints: `/signup`, `/login`, `/firebase` (ID token exchange), TODO: add OAuth callbacks if used.
  - `routes/links.js` — Links CRUD, public profile, and click-tracking endpoint with rate limiting.
  - `routes/users.js` — User profile retrieval and update endpoints (`/me`).
  - `openapi.json` — Minimal OpenAPI spec exposed via Swagger UI.
  - `public/` — Test pages (`test-auth.html`, `test-firebase.html`) for quick manual checks.

- `frontend/`

  - `src/environments/environment.ts` — Frontend Firebase config and `apiUrl` used by Angular services.
  - `src/app/core/services/auth.service.ts` — Auth flows: email/password, Firebase auth, Google/GitHub popup, exchanges ID token with backend.
  - `src/app/core/services/links.service.ts` — Calls backend links & profile endpoints; implements reorder helper.
  - `src/app/core/interceptors/auth.interceptor.ts` — Attaches JWT from `localStorage` to requests.
  - `src/app/features/*` — UI components: `auth` (login/signup), `dashboard`, `home`, `profile` (public profile page).

- `docs/` (dev docs)
  - `docs/dev/SETUP.md` — Setup instructions for backend, frontend, Firebase, and MongoDB.
  - `docs/dev/PRD.md` — Product Requirements Document.
  - `docs/dev/TODO.md` — MVP TODO checklist (developer-facing).
  - `docs/dev/ISSUES-MVP.md` — Ready-to-create GitHub issue templates.

---

**How to verify locally (quick checklist)**

1. Backend
   - `cd backend && npm install`
   - Ensure `.env` includes `MONGODB_URI`, `JWT_SECRET`, and `FIREBASE_SERVICE_ACCOUNT_PATH`.
   - `npm start` (should log: "Connected to MongoDB" and "Server listening on port <PORT>").
2. Frontend
   - `cd frontend && npm install`
   - Confirm `environment.ts` Firebase config matches your Firebase project.
   - `npm start` and open `http://localhost:4200`.
3. Test auth
   - Use frontend to sign up with email/password (calls backend `/auth/signup`).
   - Enable Google sign-in in Firebase Console and try Google popup — backend `/api/auth/firebase` should accept the ID token and return a JWT.

---

**Immediate action items (I can do these for you)**

- [ ] Verify and (if you want) remove `serviceAccountKey.json` from repo and instead set `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env` for local dev/CI.
- [ ] Add a short GitHub Actions workflow to run backend tests on push (requires tests to be added).
- [ ] Improve `docs/dev/SETUP.md` to show explicit `.env` examples and commands; update any mismatches.

---

If you want, I can: (A) update `docs/dev/SETUP.md` with exact `.env` examples and commands; (B) remove hard-coded `serviceAccountKey.json` from repo and wire `FIREBASE_SERVICE_ACCOUNT_JSON` usage; (C) create the GitHub Issues from `docs/dev/ISSUES-MVP.md`. Tell me which and I'll proceed.

---

## Complete API Inventory & How to Call Them

This section lists the HTTP endpoints currently implemented in the backend, their auth requirements, and short examples for calling them locally. The server base URL is `http://localhost:<PORT>` (default port comes from `process.env.PORT` or `5000`).

- Auth

  - `POST /api/auth/signup` — Public. Body: `{ username, email, password }` → creates user and returns `{ token, user }`.
    - Example:
      ```bash
      curl -X POST "http://localhost:5000/api/auth/signup" -H "Content-Type: application/json" -d '{"username":"alice","email":"a@ex.com","password":"P@ssw0rd"}'
      ```
  - `POST /api/auth/login` — Public. Body: `{ email, password }` → returns `{ token, user }`.
  - `POST /api/auth/forgot` — Public. Body: `{ email }` → generates reset token and emails link (requires SMTP configured; MailHog recommended in dev).
  - `POST /api/auth/reset` — Public (uses token). Body: `{ email, token, password }` → validates token, enforces password-history, sets new password, returns `{ token, user }` on success.
  - `POST /api/auth/firebase` — Public. Body: `{ idToken }` (Firebase client idToken) → verifies token with Firebase Admin and returns a local JWT for the user.

- Users

  - `GET /api/users/me` — Protected. Header: `Authorization: Bearer <JWT>` → returns current user's profile (no passwordHash).
  - `PUT /api/users/me` — Protected. Header: `Authorization: Bearer <JWT>`. Body: any of `{ username, displayName, bio, avatarUrl, theme }` → updates profile.

- Links
  - `GET /api/links/` — Protected. Get current user's links.
  - `POST /api/links/` — Protected. Create link. Body: `{ title, url, iconUrl, position }`.
  - `PUT /api/links/:id` — Protected. Update link by id.
  - `DELETE /api/links/:id` — Protected. Delete link by id.
  - `GET /api/links/users/:userId/links` — Public. Get public links by userId.
  - `GET /api/links/profile/:username` — Public. Get user profile + active links by username.
  - `GET /api/links/user/:userId` — Public. Get all links for a user id.
  - `POST /api/links/:id/click` — Public. Click-tracking (rate-limited) — increments `clicks` and returns `{ success: true, clicks }`.

## Important Environment & Runtime Notes

- Required environment variables (minimum for backend to run):

  - `MONGODB_URI` — MongoDB connection string.
  - `JWT_SECRET` — secret to sign JWTs.
  - `PORT` — optional, default `5000`.

- Optional but required for some flows:

  - `SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM` — for reset emails (defaults assume MailHog on `localhost:1025`).
  - `FRONTEND_URL` — used in reset links (default `http://localhost:4200`).
  - `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` — required for `POST /api/auth/firebase` to verify Firebase idTokens.
  - `PASSWORD_HISTORY_LIMIT` — integer controlling how many previous passwords are forbidden (default `5`; set `0` to keep full history).

- Local dev helper (MailHog):
  ```pwsh
  docker run -p 1025:1025 -p 8025:8025 mailhog/mailhog
  # MailHog UI: http://localhost:8025
  ```

## Branch / File Changes (quick map)

The primary files changed in branch `Lai` (recent work):

- Backend

  - `backend/routes/auth.js` — added forgot/reset endpoints, password-history checks, logging, and PASSWORD_HISTORY_LIMIT support.
  - `backend/models/User.js` — added `passwordHistory` field.
  - `backend/package.json` — added `nodemailer` dependency.

- Frontend
  - `frontend/src/app/features/auth/forgot/*` — `forgot.component.html/.css/.ts` (new UI, MailHog-ready flow).
  - `frontend/src/app/features/auth/reset/*` — `reset.component.html/.css/.ts` (new UI; redirect to login after reset, show/hide toggle).
  - `frontend/src/app/features/auth/login/*` — updated CSS/HTML to inset eye icon and polished button styles.
  - `frontend/src/app/features/auth/signup/*` — removed confirm-password, inset eye toggle, polished placeholder/labels and CSS.
  - `frontend/src/app/features/demo/*` — `demo.component` + route added.

## Troubleshooting: servers show Exit Code 1

Your environment currently shows both backend and frontend last-run exit codes as `1` (see workspace terminals). That means the HTTP APIs are not currently running. To bring them up:

1. Backend

   ```pwsh
   cd C:\My_Project\Link-in-Bio-Platform\backend
   npm install
   # ensure .env exists and has MONGODB_URI, JWT_SECRET (and optional SMTP vars)
   npm start
   ```

   - If it exits with an error, copy the console output here and I'll diagnose the cause.

2. Frontend
   ```pwsh
   cd C:\My_Project\Link-in-Bio-Platform\frontend
   npm install
   npm start
   ```
   - If `ng serve` fails, paste the first ~200 lines of the error and I'll patch the templates/TS or module imports.

## Recommended next actions

- Decide password-history policy: keep default 5, raise to 10, or set `0` to keep forever. I can patch code to treat `0` as keep-forever and document it in `.env.example`.
- Add a logged-in `/api/auth/change-password` endpoint that uses the same history checks (I can implement this and wire a small frontend form).
- Add unit tests for the reset & history logic and a GitHub Actions workflow.

---

If you'd like, I can now (pick one):

- Restart the backend and capture logs to fix any startup errors.
- Add the `change-password` endpoint and a simple frontend UI.
- Produce a Postman/HTTPie collection with working examples for each endpoint.

Tell me which and I'll proceed.
