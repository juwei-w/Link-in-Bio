# 🔗 Link-Sharing Profile Platform

A modern, customizable link-in-bio platform similar to Linktree. Share all your important links in one beautiful page.

## ✨ Features

- 🔐 **Authentication**: Email/password + OAuth (Google)
- 👤 **Custom Profiles**: Unique username URLs (`yourdomain.com/username`)
- 🖼️ **Avatar Upload**: Cloudinary-powered image management
- 🔗 **Link Management**: Create, edit, delete, and reorder links (drag & drop)
- 📊 **Analytics**: Click tracking and trends visualization
- 📱 **Responsive Design**: Beautiful on mobile and desktop
- 🔥 **Firebase Integration**: Email verification & password reset

## 🚀 Live Demo & Deployment

### 🌐 Live Application

- **Frontend**: https://link-in-bio-platform.web.app/
- **Backend API**: https://link-in-bio-platform.onrender.com/

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

## 📊 Current Status

**MVP Complete** ✅
- [x] Authentication (email + OAuth)
- [x] Profile management
- [x] Links CRUD
- [x] Click tracking
- [x] Analytics dashboard
- [x] Avatar upload
- [x] Deployment ready

**In Progress** 🚧
- [ ] QR code generation
- [ ] Custom domains
- [ ] Advanced analytics (geo, referrers)

See [docs/dev/TODO.md](docs/dev/TODO.md) for full task list.

## 👥 Team

- **Juwei**: Backend, analytics, deployment
- **Chengyung**: Frontend, UI/UX, QR codes

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
