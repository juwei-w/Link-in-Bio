# Project TODO (MVP) — Link-Sharing / Profile Platform

This TODO is derived from the PRD and broken into actionable tasks for the MVP. Tasks are grouped by epic and ordered roughly by priority. Mark items done as you complete them.

## How to use

- Each item is a task — click the checkbox when complete.
- Where applicable, there is a short acceptance criteria line. Use `docs/dev/ISSUES-MVP.md` to copy full issue text into GitHub if you want to create issues from these tasks.

---

## Authentication & Accounts

- [x] Create PRD and Issues (docs)

  - Acceptance: `docs/dev/PRD.md` and `docs/dev/ISSUES-MVP.md` exist and reflect MVP decisions.

- [x] Auth — Email/password signup & JWT (backend)

  - Acceptance: POST `/api/auth/signup` and POST `/api/auth/login` implemented; passwords hashed with bcrypt; login returns JWT.

- [x] Auth — Firebase email verification & password reset (integration)

  - Acceptance: Firebase flows documented and working in dev (verify email, trigger password reset).

- [x] Auth — OAuth: Google (backend + frontend)

  - Acceptance: OAuth flows implemented (callback endpoints / token exchange); frontend demo login working; user accounts mapped to local users.

- [x] User model & username rules

  - Acceptance: Username validated (3–16 chars, letters/numbers/-/\_), normalized to lowercase, uniqueness enforced, tests for validation.

- [x] Profile picture upload with Cloudinary
  - Acceptance: Users can upload, crop (circular), and remove profile pictures; images stored in Cloudinary; URLs saved in MongoDB; pictures displayed on dashboard and public profile.

---

## Links & Profiles

- [x] Links CRUD API (backend)

  - Acceptance: POST `/api/links`, PUT `/api/links/:id`, DELETE `/api/links/:id`, GET `/api/users/:id/links` implemented and access-controlled.

- [x] Click tracking endpoint (backend)

  - Acceptance: POST `/api/links/:id/click` increments persistent counter and has basic rate-limiting.

- [x] Public profile route (frontend)

  - Acceptance: `/:username` shows avatar, bio and ordered link list. Clicking a link increments click counter or uses redirect to register clicks.

- [x] Dashboard — Links management UI (frontend)

  - Acceptance: Authenticated user can add/edit/delete links and reorder via drag-and-drop; changes persist.

- [x] Dashboard — Show click counts (frontend)
  - Acceptance: Link items in dashboard display click totals from backend.

---

## Infra, Deploy & Tests

- [x] Deploy guide & basic infra (Firebase + Render)

  - Acceptance: README contains steps for setting up Firebase hosting and Render backend; includes required env vars and free-tier hints.

- [ ] Basic tests & CI (backend) — **Assigned to Juwei**
  - Acceptance: Unit/integration tests for auth and links exist and GitHub Actions workflow runs tests on push.

---

## Design, UX & Styling

- [x] Apply "Neo-Minimalist Creator Style" theme baseline

  - Acceptance: Add a baseline theme (colors, fonts, spacing) for frontend and a simple theme switch (light/dark) mechanism.

- [x] Responsive layout tweaks
  - Acceptance: Public profile and dashboard render nicely on mobile and desktop (basic manual checks).

---

## Post-MVP / Backlog (defer unless resources permit)

### Assigned to Juwei (Complex/Backend-Heavy):

- [ ] Custom themes & color editor (premium later)
  - Requires: Color picker UI, theme state management, CSS variable generation, database storage
- [x] Analytics dashboard — Show click trends over time with charts
  - Requires: Time-series data aggregation, chart library integration (Chart.js/Recharts), date filtering
- [x] Link scheduling — Enable/disable links on specific dates/times
  - Requires: Cron jobs/scheduled tasks, timezone handling, backend logic for active/inactive state
- [x] Advanced analytics (referrers, geography, time-series)
  - Requires: Complex data tracking, IP geolocation, referrer parsing, database optimization
- [ ] Custom domains and payments/subscriptions
  - Requires: DNS configuration, SSL certificates, payment gateway integration (Stripe), subscription management

### Assigned to Chengyung (UI/UX-Focused):

- [x] Firebase Email Verification — Ensure signup sends verification email and handles verification flow
  - Requires: Testing email delivery, creating verification success page, error handling
- [x] Password Reset Flow — Test and document forgot password → reset link → new password
  - Requires: Testing email delivery, creating reset password page, token validation, updating password
- [ ] Share buttons — Add social sharing (Twitter, Facebook, LinkedIn)
  - Requires: Social media API integration, share URLs generation, button UI components
- [ ] QR code generation for profile pages
  - Requires: QR code library (qrcode.js), download/copy functionality, modal UI
- [ ] Link icons/favicons — Auto-fetch or allow users to add icons for links
  - Requires: Favicon API integration (Google, Clearbit), image upload, icon display
- [ ] Custom profile URL — Allow users to customize their `/:username` slug
  - Requires: URL validation, uniqueness check, redirect handling, settings UI
