## Link-Sharing / Profile Page Platform — Product Requirements Document (PRD)

### Document version

- Author: Drafted from `Project-Idea.md`
- Date: 2025-11-17
- Status: Draft

## 1. Overview

A lightweight web service that lets users create a public personal profile page (a "link-in-bio") where they can add, order and share multiple links. The product targets creators, freelancers and small businesses who want a single, customizable hub to list social media, portfolio links, contact methods and resources.

This PRD defines the MVP, core features, user stories, data model, API surface, non-functional requirements, success metrics, timeline, and open questions.

## 2. Goals

- Deliver an MVP that allows users to sign up, create a public profile page at a short URL (e.g. `/username`), and manage links (add/edit/delete/reorder).
- Provide click tracking for links (basic analytics).
- Offer a simple, responsive, attractive public profile and a private dashboard for management.
- Keep the architecture modular so frontend, backend and analytics can be worked on in parallel by a small team.

## 3. Success Criteria / Metrics

- 1st-week internal demo: create accounts, publish profile pages, and collect click events.
- Track key metrics: signups, published profiles, average links per profile, click-throughs per profile.
- Performance: public profile pages must load under 1s (cold) on typical broadband connections.

## 4. Target Users

- Influencers, content creators, freelancers, small business owners who need a simple hub to share links.
- Early adopters who want a free/basic tier and may upgrade for premium features later.

## 5. MVP (Must-have) Features

1. User Authentication & Profile
   - Email/password signup and login (JWT-based sessions for API).
   - Unique username / profile slug.
   - Profile fields: display name, short bio, avatar (optional), theme (light/dark).

2. Link Management
   - Add, edit, delete a link (title, destination URL, optional icon/image, optional tag).
   - Reorder links (position field exposed via API; drag & drop in UI).
   - Click count per link.

3. Public Profile Page
   - Publicly accessible at `/{username}`.
   - Lists links with titles and optional icons; supports responsive layout.

4. Basic Analytics
   - Increment a click counter when link is visited via the profile page.
   - Provide simple totals per link in the dashboard.

5. Dashboard
   - Simple authenticated UI to manage profile and links.

## 6. Optional / Post-MVP Features

- QR code generation for profile pages.
- Custom themes and colors.
- Social sharing buttons.
- Premium: custom domain, advanced analytics (geography, referrers, time-series), scheduled links.

## 7. User Stories

- As a new user, I want to sign up with my email so I can manage my link profile.
- As an authenticated user, I want to add and reorder links so I can prioritize content.
- As a visitor, I want to open `/{username}` and click a link without logging in.
- As a user, I want to see how many clicks each link received.

## 8. Functional Requirements

- FR1: System shall allow user registration and login via email/password.
- FR2: System shall create and store a unique username/slug for each user.
- FR3: System shall support CRUD operations for links associated with a user.
- FR4: System shall serve public profile pages by slug with no authentication.
- FR5: System shall increment and persist a click count when a link from a public profile is clicked.

## 9. Non-Functional Requirements

- NFR1: Security — passwords must be hashed (bcrypt or equivalent). JWT secrets must be stored in environment variables.
- NFR2: Scalability — design so analytics writes are cheap; consider eventual consistency for counters initially.
- NFR3: Availability — public profile pages should be served from a CDN or fast static host if possible.
- NFR4: Privacy — profiles and link destinations are public by design, but user account details (email, password) must be private.

## 10. Data Model (Suggested)

- Users

```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string",
  "passwordHash": "string",
  "displayName": "string",
  "avatarUrl": "string",
  "bio": "string",
  "theme": "string",
  "createdAt": "ISODate"
}
```

- Links

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "title": "string",
  "url": "string",
  "iconUrl": "string",
  "position": "number",
  "clicks": "number",
  "createdAt": "ISODate"
}
```

Notes: counters can be simple numeric fields that are incremented via an API call. For high scale consider buffered/event-driven writes later.

## 11. API Endpoints (MVP)

| Endpoint | Method | Purpose |
|---|---:|---|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Return JWT |
| `/api/users/:id` | GET | Get user/profile (private) |
| `/api/users/:id` | PUT | Update profile settings (private) |
| `/api/links` | POST | Add a new link (private) |
| `/api/links/:id` | PUT | Update a link (private) |
| `/api/links/:id` | DELETE | Remove a link (private) |
| `/api/links/:id/click` | POST | Increment click counter (public called when link clicked) |
| `/:username` | GET | Serve public profile page (frontend route) |

Implementation note: protect private endpoints with JWT middleware. The click endpoint may be open but should be rate-limited.

## 12. UX / Frontend Notes

- Public profile page: clean vertical list of link cards with optional avatar and bio at top.
- Dashboard: editable list with drag-and-drop reordering, inline edit, and a quick analytics column.
- Responsive: mobile-first design since many visitors will come from mobile.

## 13. Timeline & Milestones (suggested, 4–6 week sprint)

- Week 1: Project setup, authentication, basic user model, and profile slug creation.
- Week 2: Links CRUD, API, and simple dashboard UI.
- Week 3: Public profile page, reordering (drag & drop), and click tracking.
- Week 4: Polish UI, add basic analytics in dashboard, testing, and deploy minimal stack.

## 14. Risks & Mitigations

- Risk: Username collision / slug hijacking — Mitigation: enforce unique username, reserved words list, and profile editing confirmation.
- Risk: Analytics write contention at scale — Mitigation: use batch/event-driven counting or Redis counters later.
- Risk: Malicious links spreading malware — Mitigation: optionally add link validation, show external link warning, and allow users to report profiles.

## 15. Deployment & Hosting (suggested)

- Frontend: Firebase Hosting or static host behind a CDN.
- Backend: Render / Heroku / Vercel Serverless (Node) or a small VPS. Use managed MongoDB (Atlas) for database.

## 16. Decisions, Open Questions & Assumptions

Decisions provided by the product owner (recorded here to remove ambiguity):

- Tech stack: Keep MEAN-like (Angular frontend + Node/Express backend + MongoDB). Backend will deploy to Render; frontend will deploy to Firebase.
- Authentication: Include email/password + JWT for API auth, and add Google + GitHub OAuth providers in the MVP.
- Username rules: Enforce username length between 3 and 16 characters. Allowed characters: letters (a-z), numbers (0-9), hyphen (-) and underscore (_). Username/slugs will be stored normalized (lowercase) and treated case-insensitively.
- Email flows: Use Firebase Authentication for email verification and password reset flows in the MVP.
- Analytics: MVP will track click counts only (no referrers/geolocation/time-series for MVP).
- Monetization: Push payments/custom domains to post-MVP (not prioritized now).
- Hosting constraints: Aim to host entirely using free tiers where possible (frontend on Firebase free tier; backend on Render free tier or an alternate free host if Render's free tier changes; we should confirm feasibility before final deploy).
- Branding / UX: Adopt a "Neo-Minimalist Creator Style" — modern, universal, professional yet aesthetic, and easy to customize themes later.

Remaining/clarifying questions (small, actionable):

1. OAuth: Confirmed to include Google and GitHub for MVP.
2. Username reserved-words: Do you want a reserved list (e.g., `admin`, `support`, `api`, common TLDs)? I can add a default reserved list if you want.
3. Firebase project: Do you already have a Firebase project/account you'd like to use, or should I include setup instructions for creating one?
4. Issue import: I will produce `docs/dev/ISSUES-MVP.md` with ready-to-create issue titles and descriptions — do you want me to also open them on GitHub for you (that requires a token), or is a local file enough so you can create them manually?

## 17. Next steps (proposed)

1. You review and confirm the remaining clarifying items above.
2. After confirmation I will:
   - Convert the PRD's MVP items into GitHub Issues and a lightweight project board (unless you prefer only a backlog of issues).
   - Scaffold a minimal repo structure (frontend + backend) with initial auth routes and data models, plus one or two unit/integration tests to validate the setup.
   - Implement Google OAuth wiring in the backend (auth routes + frontend flow) and a stubbed Firebase + Render deployment guide that uses free tiers where possible.

---

If you'd like me to proceed now with converting this PRD into issues and scaffolding the repo, say which of the following you prefer first: (A) create Issues for MVP only, (B) create Issues for MVP + Post-MVP features, or (C) scaffold the repo first and wire a minimal auth flow (signup/login + Google OAuth demo).

---

If anything here doesn't match your intent or you want certain sections expanded (wireframes, API contracts, DB indexing strategy, example JWT flows, or a detailed milestone schedule), tell me which part and I'll expand it.
