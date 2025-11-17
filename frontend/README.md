# Link Sharing Platform - Frontend

Modern Angular 17+ application for the Link Sharing Platform, featuring standalone components, Firebase Authentication, and a Neo-Minimalist Creator Style design.

## Features

- 🔐 **Multiple Auth Options**: Email/password, Firebase Auth, Google OAuth, GitHub OAuth
- 🎨 **Neo-Minimalist Design**: Clean, modern UI with light/dark mode support
- 📊 **Link Management**: Create, edit, delete, and reorder links with drag-and-drop
- 📈 **Analytics**: Track clicks on all your links
- 🌐 **Public Profiles**: Beautiful landing pages at `/:username`
- ⚡ **Modern Stack**: Angular 17+ with standalone components, RxJS, and Firebase SDK

## Prerequisites

- Node.js 18+ and npm
- Angular CLI 17+ (`npm install -g @angular/cli`)
- Backend server running (see `../backend/README.md`)
- Firebase project with Authentication enabled

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication > Sign-in methods:
   - Email/Password
   - Google (optional)
   - GitHub (optional)
4. Go to Project Settings > General
5. Copy your Firebase config

### 3. Environment Configuration

Update `src/environments/environment.ts` with your Firebase config:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};
```

For production, update `src/environments/environment.prod.ts` with your production backend URL.

## Development

### Start Development Server

```bash
npm start
```

The app will be available at `http://localhost:4200`

### Build for Production

```bash
npm run build
```

Built files will be in `dist/link-sharing-frontend/`

## Project Structure

```
src/
├── app/
│   ├── core/                 # Core services, guards, interceptors
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   └── services/
│   │       ├── auth.service.ts
│   │       └── links.service.ts
│   ├── features/             # Feature modules (lazy-loaded)
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── dashboard/        # Link management
│   │   ├── home/             # Landing page
│   │   └── profile/          # Public profile view
│   ├── app.component.ts      # Root component
│   └── app.routes.ts         # App routing
├── environments/             # Environment configs
├── styles.css                # Global styles (Neo-Minimalist theme)
└── index.html
```

## Key Features

### Authentication Flow

1. **Local Email/Password**: Direct signup/login with backend
2. **Firebase Auth**: Frontend uses Firebase SDK, exchanges ID token with backend for JWT
3. **OAuth (Google/GitHub)**: Firebase popup flow, backend creates/finds user by provider ID

### Protected Routes

The `authGuard` protects routes like `/dashboard`. Unauthenticated users are redirected to `/login`.

### Link Management

- **CRUD Operations**: Create, read, update, delete links
- **Drag-and-Drop Reordering**: Visual reordering persists to backend
- **Click Tracking**: Each link click increments counter

### Public Profiles

- Accessible at `/:username`
- Shows user's avatar, bio, and active links
- Beautiful gradient background
- Click tracking on link visits

## Styling & Theming

The app uses a **Neo-Minimalist Creator Style**:

- CSS Custom Properties for theming
- Light/Dark mode support (toggle via body class `dark-mode`)
- Consistent spacing, shadows, and transitions
- Gradient accents for primary actions

### Theme Variables

Defined in `src/styles.css`:

```css
:root {
  --color-primary: #6366f1;
  --color-secondary: #8b5cf6;
  --color-accent: #ec4899;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  /* ... */
}
```

## Testing

```bash
npm test
```

Runs Karma + Jasmine unit tests.

## Deployment

### Firebase Hosting

```bash
npm run build
firebase init hosting
firebase deploy
```

### Vercel

```bash
npm run build
vercel --prod
```

### Netlify

1. Connect your Git repository
2. Build command: `npm run build`
3. Publish directory: `dist/link-sharing-frontend`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `apiUrl` | Backend API URL | `http://localhost:3000/api` |
| `firebase.apiKey` | Firebase API Key | From Firebase Console |
| `firebase.projectId` | Firebase Project ID | `my-project-123` |

## Troubleshooting

### CORS Errors

Ensure your backend has CORS enabled for your frontend origin:

```javascript
// backend/server.js
app.use(cors({ origin: 'http://localhost:4200' }));
```

### Firebase Auth Errors

- Check that Firebase config is correct
- Verify authentication methods are enabled in Firebase Console
- Ensure backend Firebase Admin SDK uses the same project

### TypeScript Errors

The errors shown during file creation are expected until dependencies are installed:

```bash
npm install
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

## License

MIT


4. Add Firebase hosting and Authentication later. Quick Firebase setup:

- Create a Firebase project at https://console.firebase.google.com/
- Enable Authentication (Email/Password, Google, GitHub providers) and create OAuth client IDs as required.
- Install Firebase in the Angular app:

```powershell
npm install firebase @angular/fire
```

5. For local development:

```powershell
cd frontend
npm install
ng serve
```

Notes & next steps:
- I will add a small starter `src/` and Angular components (Auth, Dashboard, PublicProfile) after you confirm you want Angular. For now this README explains how to create the app using the CLI.
- If you prefer a faster lightweight SPA to iterate quickly, say so and I can scaffold a minimal Vite/React or vanilla app instead.
