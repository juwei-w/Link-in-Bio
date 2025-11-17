# Project TODO (MVP) — Link-Sharing / Profile Platform

This TODO is derived from the PRD and broken into actionable tasks for the MVP. Tasks are grouped by epic and ordered roughly by priority. Mark items done as you complete them.

## How to use

- Each item is a task — click the checkbox when complete.
- Where applicable, there is a short acceptance criteria line. Use `docs/dev/ISSUES-MVP.md` to copy full issue text into GitHub if you want to create issues from these tasks.

---

## Authentication & Accounts

- [x] Create PRD and Issues (docs)
  - Acceptance: `docs/dev/PRD.md` and `docs/dev/ISSUES-MVP.md` exist and reflect MVP decisions.

- [ ] Auth — Email/password signup & JWT (backend)
  - Acceptance: POST `/api/auth/signup` and POST `/api/auth/login` implemented; passwords hashed with bcrypt; login returns JWT.

- [ ] Auth — Firebase email verification & password reset (integration)
  - Acceptance: Firebase flows documented and working in dev (verify email, trigger password reset).

- [ ] Auth — OAuth: Google + GitHub (backend + frontend)
  - Acceptance: OAuth flows implemented (callback endpoints / token exchange); frontend demo login working; user accounts mapped to local users.

- [ ] User model & username rules
  - Acceptance: Username validated (3–16 chars, letters/numbers/-/_), normalized to lowercase, uniqueness enforced, tests for validation.

---

## Links & Profiles

- [ ] Links CRUD API (backend)
  - Acceptance: POST `/api/links`, PUT `/api/links/:id`, DELETE `/api/links/:id`, GET `/api/users/:id/links` implemented and access-controlled.

- [ ] Click tracking endpoint (backend)
  - Acceptance: POST `/api/links/:id/click` increments persistent counter and has basic rate-limiting.

- [ ] Public profile route (frontend)
  - Acceptance: `/:username` shows avatar, bio and ordered link list. Clicking a link increments click counter or uses redirect to register clicks.

- [ ] Dashboard — Links management UI (frontend)
  - Acceptance: Authenticated user can add/edit/delete links and reorder via drag-and-drop; changes persist.

- [ ] Dashboard — Show click counts (frontend)
  - Acceptance: Link items in dashboard display click totals from backend.

---

## Infra, Deploy & Tests

- [ ] Deploy guide & basic infra (Firebase + Render)
  - Acceptance: README contains steps for setting up Firebase hosting and Render backend; includes required env vars and free-tier hints.

- [ ] Basic tests & CI (backend)
  - Acceptance: Unit/integration tests for auth and links exist and GitHub Actions workflow runs tests on push.

---

## Design, UX & Styling

- [ ] Apply "Neo-Minimalist Creator Style" theme baseline
  - Acceptance: Add a baseline theme (colors, fonts, spacing) for frontend and a simple theme switch (light/dark) mechanism.

- [ ] Responsive layout tweaks
  - Acceptance: Public profile and dashboard render nicely on mobile and desktop (basic manual checks).

---

## Post-MVP / Backlog (defer unless resources permit)

- [ ] QR code generation for profile pages
- [ ] Custom themes & color editor (premium later)
- [ ] Social sharing buttons & advanced analytics (referrers/time-series)
- [ ] Custom domains and payments/subscriptions

---

## Notes & Next Steps

- If you'd like, I can convert high-priority tasks above into GitHub Issues automatically (I would need a token). Otherwise use `docs/dev/ISSUES-MVP.md` to copy/paste issue content.
- After you confirm, I can scaffold the repo structure and implement the top 2 tasks (scaffold + basic auth endpoints) next.
