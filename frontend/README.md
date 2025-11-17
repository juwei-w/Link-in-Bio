# Frontend (Angular) — Link-Sharing / Profile Platform

This folder holds the frontend application (Angular) for the Link-Sharing / Profile Platform.

Recommended setup (create Angular app):

1. Install Angular CLI (if you don't have it):

```powershell
npm install -g @angular/cli
```

2. Create a new Angular app inside this `frontend` folder (this will populate the folder):

```powershell
cd frontend
ng new app --routing --style=css
```

3. Move the generated `app` folder contents up one level or adjust paths to match repo structure. Alternatively, create the Angular app elsewhere and copy the `src/` into this folder.

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
