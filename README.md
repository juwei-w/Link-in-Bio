# 🔗 Link-in-Bio

A premium, customizable Link-in-Bio platform designed to centralize your digital presence. Distinguishing itself from standard link aggregators, this solution offers a seamless, high-performance user experience powered by a robust Node/Express backend and a responsive Angular 17 frontend. Featuring integrated analytics, secure authentication, and dynamic media management, it empowers users with complete control over their personal brand through a sophisticated, enterprise-grade architecture.

## ✨ Features

- 🔐 **Authentication**: Email/password + OAuth (Google)
- 👤 **Custom Profiles**: Unique username URLs
- 🖼️ **Avatar Upload**: Cloudinary-powered image management
- 🔗 **Link Management**: Create, edit, delete, and reorder links (drag & drop)
- 📊 **Analytics**: Click tracking and trends visualization
- 📱 **Responsive Design**: Beautiful on mobile and desktop
- 🔥 **Firebase Integration**: Email verification & password reset

## 🚀 Live Demo & Deployment

### 🌐 Live Application

- **Frontend**: https://link-in-bio-platform.web.app/

**Auto-Deploy:** Every push to `main` automatically deploys both frontend and backend.

---

## 🏃 Quick Start

### Local Development

```powershell
# Clone repository
git clone https://github.com/juwei-w/Link-in-Bio-Platform.git
cd Link-in-Bio-Platform

# Backend setup
cd backend
npm install
# Copy .env.example to .env and configure
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm start
```

See [docs/dev/SETUP.md](docs/dev/SETUP.md) for detailed setup instructions.


**Deployment Stack:**
- **Backend**: Render.com (auto-deploy from GitHub)
- **Frontend**: Firebase Hosting (auto-deploy via GitHub Actions)
- **Database**: MongoDB Atlas
- **Images**: Cloudinary

## 📁 Project Structure

```
Link-Sharing-Profile-Platform/
├── backend/          # Node.js + Express API
│   ├── routes/       # API endpoints
│   ├── models/       # MongoDB schemas
│   ├── middleware/   # Auth & validation
│   └── config/       # Database & Cloudinary
├── frontend/         # Angular 17 app
│   └── src/
│       ├── app/
│       │   ├── features/  # Pages (login, dashboard, profile)
│       │   ├── core/      # Services, guards, interceptors
│       │   └── shared/    # Reusable components
│       └── environments/  # Config (dev/prod)
└── docs/            # Documentation
    ├── dev/         # Development guides (PRD, TODO, ISSUES)
    ├── DEPLOYMENT.md           # Full deployment guide
    └── DEPLOYMENT-CHECKLIST.md # Quick deployment steps
```

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- Firebase Admin SDK
- Cloudinary (image upload)
- JWT authentication
- Bcrypt (password hashing)

### Frontend
- Angular 17
- Firebase Authentication
- Chart.js (analytics)
- RxJS
- TypeScript

## � Task Distribution

- **Ju Wei**:
  1. **Backend Architecture**: Engineered the robust Node.js/Express REST API and MongoDB schema.
  2. **Authentication**: Implemented secure JWT/Session auth and Firebase Google OAuth integration.
  3. **DevOps**: Configured automated CI/CD pipelines for seamless deployment (Render/Firebase).
  4. **Cloud Integrations**: Integrated Cloudinary for optimized image storage and transformation.
  5. **Core Frontend**: Built the core Angular structure, authentication guards, and http services.
  6. **Interactive Features**: Developed the drag-and-drop link reordering and theme customization (Color Picker).

- **Cheng Yung**:
  1. **UI/UX Design**: Designed the modern, glassmorphic user interface and responsive layouts.
  2. **Analytics Dashboard**: Implemented interactive data visualization using Chart.js.
  3. **Public Profile**: Developed the public-facing profile page with dynamic link rendering, QR code generation, and social sharing capabilities.
  4. **Documentation**: Authored comprehensive PRD, API documentation, and setup guides.
  5. **Quality Assurance**: Conducted comprehensive software testing and bug tracking.

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/juwei-w/Link-in-Bio-Platform/issues)
- **Docs**: See `docs/` folder
- **PRD**: [docs/dev/PRD.md](docs/dev/PRD.md)
