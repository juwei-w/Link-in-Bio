# MVP Issues (ready-to-create)

This file converts the PRD MVP into a set of actionable GitHub-style issues. Create these as issues in the repository (labels suggested: backend, frontend, auth, infra, enhancement, bug, chore). I've included acceptance criteria and a rough estimate.

---

## Epic: Authentication & Accounts (auth, backend) — 5 pts

1) Issue: Auth — Email / Password signup & JWT login (backend)
   - Description: Implement email/password signup, secure password hashing (bcrypt), and login returning JWT for API use.
   - Acceptance criteria: POST /api/auth/signup and POST /api/auth/login endpoints implemented; passwords stored hashed; login returns a JWT with user id; unit tests cover signup/login.
   - Labels: auth, backend

2) Issue: Auth — Firebase Email verification & password reset (integration)
   - Description: Integrate Firebase Authentication to handle email verification and password reset flows for the frontend and backend where needed.
   - Acceptance criteria: Users can trigger email verification and password reset flows through Firebase; flows tested in dev; instructions added to README.
   - Labels: auth, integration, infra

3) Issue: Auth — OAuth: Google + GitHub (backend + frontend) — 3 pts
   - Description: Add OAuth sign-in with Google and GitHub. Backend should accept provider tokens and create/return a local JWT session.
   - Acceptance criteria: OAuth flows for Google and GitHub implemented with endpoints for callback/token exchange; frontend demo flow for OAuth login exists; accounts map to user records; no duplicates on repeated sign-ins.
   - Labels: auth, backend, frontend

4) Issue: User model & username rules (backend)
   - Description: Implement user model enforcing username rules: 3-16 chars; letters, numbers, -, _ allowed; normalized to lowercase; uniqueness enforced; reserved-words check optional.
   - Acceptance criteria: User creation validates username rules; duplicate usernames rejected; test cases for boundary lengths and invalid chars.
   - Labels: backend

---

## Epic: Links & Profiles (backend + frontend) — 5 pts

5) Issue: Links CRUD API (backend) — 3 pts
   - Description: Implement CRUD for links: POST /api/links, PUT /api/links/:id, DELETE /api/links/:id, GET /api/users/:id/links.
   - Acceptance criteria: Endpoints accept/return JSON, validate owner authorization, support position field for ordering; tests cover primary flows.
   - Labels: backend

6) Issue: Click tracking endpoint (backend) — 1 pt
   - Description: Implement POST /api/links/:id/click to increment click counter for a link; implement basic rate-limiting.
   - Acceptance criteria: Clicks increment and persist; endpoint callable from public profile; simple rate-limit applied.
   - Labels: backend, infra

7) Issue: Public profile route (frontend) — 2 pts
   - Description: Implement public profile page at `/:username` that displays profile info and links; links open externally (increment click via API or server redirect).
   - Acceptance criteria: Visiting `/:username` shows user avatar, bio, and ordered links; clicking a link increments click counter or routes through a redirect endpoint.
   - Labels: frontend

8) Issue: Dashboard — Links management UI (frontend) — 3 pts
   - Description: Add authenticated dashboard to manage links: add/edit/delete and drag-and-drop reorder (persist via API).
   - Acceptance criteria: Authenticated user can manage links; reorder updates position in backend; UI responsive on mobile.
   - Labels: frontend, enhancement

9) Issue: Dashboard — Show click counts (frontend)
   - Description: Display click totals per link in the dashboard next to each link.
   - Acceptance criteria: Click counts from API shown in dashboard; updates reflect increments.
   - Labels: frontend, enhancement

---

## Epic: Infra, Deploy & Tests — 3 pts

10) Issue: Deploy guide & basic infra (infra) — 2 pts
    - Description: Add a short deployment guide to README showing Firebase setup for frontend and Render setup for backend (free-tier instructions). Include environment variable list and minimal steps.
    - Acceptance criteria: README contains steps to create Firebase project, configure hosting, and deploy frontend; backend README contains Render deployment steps and required env vars.
    - Labels: infra, docs

11) Issue: Basic tests & CI (backend) — 1 pt
    - Description: Add a few unit/integration tests for auth and links and a simple CI pipeline (GitHub Actions) that runs tests on push.
    - Acceptance criteria: Tests exist and GitHub Actions workflow runs them on pushes to branches.
    - Labels: tests, ci

---

Notes
- Estimates are indicative (points). Adjust to your team's scale.
- If you want, I can create these issues on GitHub automatically (I would need your permission and a token). Otherwise, you can copy-paste the titles/descriptions into GitHub.
