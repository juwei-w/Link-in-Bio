# Backend — Link-Sharing / Profile Platform

Quick start (development):

1. Copy `.env.example` to `.env` and fill in values (MongoDB URI, JWT secret):

   - MONGODB_URI
   - JWT_SECRET
   - PORT (optional)

2. Install dependencies and start dev server:

```powershell
cd backend
npm install
npm run dev
```

3. Endpoints (examples):

- POST /api/auth/signup — body: { username, email, password }
- POST /api/auth/login — body: { email, password }
- POST /api/links — Authorization: Bearer <token> (create link)
- POST /api/links/:id/click — increments click count for link

Notes:
- This is a minimal scaffold for the MVP. OAuth routes and frontend integration instructions will be added next.
- For email verification / password reset we will integrate Firebase Authentication (recommended for free tier and quick setup).
