# Link-Sharing Profile Platform - Setup Guide

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB (local or cloud instance)
- Firebase project (for authentication)
- Git

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration:
# - MONGODB_URI: Your MongoDB connection string
# - JWT_SECRET: Generate a strong random secret
# - Firebase service account (see Firebase Setup below)

# Start MongoDB (if running locally)
# mongod

# Start backend server
npm start
```

Backend runs on `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your Firebase config (see Firebase Setup below)

# Start development server
npm start
```

Frontend runs on `http://localhost:4200`

---

## 🔥 Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Follow the setup wizard

### Step 2: Enable Authentication Methods

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable:
   - **Email/Password**
   - **Google** (optional)
   - **GitHub** (optional)

### Step 3: Get Web App Credentials

1. Go to **Project Settings** > **Your apps**
2. Click **Web** icon (</>) to add a web app
3. Register app and copy the config:

```javascript
{
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

4. Add these to `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 4: Get Admin SDK Credentials (Backend)

1. Go to **Project Settings** > **Service accounts**
2. Click **Generate new private key**
3. Save the JSON file as `serviceAccountKey.json` in `backend/` directory
4. Update `backend/.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

---

## 🗄️ MongoDB Setup

### Option 1: Local MongoDB

```bash
# Install MongoDB Community Edition
# https://www.mongodb.com/try/download/community

# Start MongoDB
mongod

# Connection string
MONGODB_URI=mongodb://localhost:27017/link-bio-platform
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Add database user
4. Whitelist IP (0.0.0.0/0 for development)
5. Get connection string:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/link-bio-platform?retryWrites=true&w=majority
```

---

## 🔐 Security Configuration

### Generate JWT Secret

```bash
# Use Node.js to generate random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `backend/.env`:

```env
JWT_SECRET=your_generated_secret_here
```

---

## 📦 Project Structure

```
Link-Sharing-Profile-Platform/
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth middleware
│   ├── models/          # MongoDB models (User, Link)
│   ├── routes/          # API routes (auth, links)
│   ├── .env             # Environment variables
│   ├── .env.example     # Environment template
│   ├── firebaseAdmin.js # Firebase Admin SDK
│   ├── server.js        # Express server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── core/           # Services, guards, interceptors
    │   │   │   ├── guards/     # Auth guard
    │   │   │   ├── interceptors/ # JWT interceptor
    │   │   │   └── services/   # Auth, Links services
    │   │   └── features/       # Feature components
    │   │       ├── home/       # Landing page
    │   │       ├── auth/       # Login, Signup
    │   │       ├── dashboard/  # Link management
    │   │       └── profile/    # Public profile
    │   └── environments/       # Environment configs
    ├── .env                    # Environment variables
    ├── .env.example            # Environment template
    └── package.json
```

---

## 🧪 Testing the Setup

### 1. Check Backend

```bash
curl http://localhost:5000/health
# Expected: {"status":"ok"}
```

### 2. Test Authentication

1. Navigate to `http://localhost:4200`
2. Click **Sign Up**
3. Create account with email/password
4. Login and access Dashboard

### 3. Test Link Management

1. Go to Dashboard
2. Click **Add Link**
3. Create a link with title and URL
4. Test drag-and-drop reordering
5. Visit your profile at `http://localhost:4200/your-username`

---

## 🎨 Features

- ✅ **Authentication**: Email/Password, Google, GitHub (via Firebase)
- ✅ **Link Management**: CRUD operations with drag-and-drop
- ✅ **Click Tracking**: Analytics for each link
- ✅ **Dark Mode**: Smooth theme transitions with localStorage persistence
- ✅ **Public Profiles**: Custom username URLs
- ✅ **Premium UI**: Awwwards-style glassmorphism design
- ✅ **Protected Routes**: Auth guards on dashboard/profile
- ✅ **JWT Security**: HTTP-only token management

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check MongoDB is running
mongosh

# Check .env file exists and is configured
cat backend/.env

# Check port 5000 is available
netstat -an | findstr :5000
```

### Frontend can't connect to backend

1. Check backend is running on port 5000
2. Verify `VITE_API_URL=http://localhost:5000/api` in `frontend/.env`
3. Check CORS settings in `backend/server.js`

### Firebase authentication errors

1. Verify Firebase config in `frontend/.env`
2. Check authentication methods enabled in Firebase Console
3. Ensure `serviceAccountKey.json` exists in `backend/`

### MongoDB connection issues

1. Check MongoDB is running: `mongosh`
2. Verify connection string in `backend/.env`
3. For Atlas: whitelist your IP address

---

## 📚 API Documentation

Once backend is running, visit:
- Swagger UI: `http://localhost:5000/docs`
- OpenAPI spec: `http://localhost:5000/openapi.json`

---

## 🚢 Deployment

### Backend (Render)

1. Push to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Connect repository
4. Set environment variables
5. Deploy

### Frontend (Vercel)

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Set environment variables
4. Deploy

Update `frontend/src/environments/environment.prod.ts` with production URLs.

---

## 📝 Environment Variables Reference

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/link-bio-platform
JWT_SECRET=your_jwt_secret
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
CORS_ORIGIN=http://localhost:4200
```

### Frontend (.env)

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:5000/api
```

---

## 🎯 Next Steps

1. ✅ Complete OAuth implementation (Google/GitHub buttons)
2. ✅ Add user profile customization (bio, avatar, themes)
3. ✅ Implement link analytics dashboard
4. ✅ Add custom domain support
5. ✅ Create link preview/QR code generation
6. ✅ Add social media integrations

---

## 📄 License

MIT

## 💬 Support

For issues or questions, please open an issue on GitHub.
