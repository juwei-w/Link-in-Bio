require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { connect } = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./openapi.json');

const authRoutes = require('./routes/auth');
const linksRoutes = require('./routes/links');
const usersRoutes = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from backend/public (test pages / future static hosting)
app.use(express.static(path.join(__dirname, 'public')));

// API docs (OpenAPI / Swagger UI)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));

app.use('/api/auth', authRoutes);
app.use('/api/links', linksRoutes);
app.use('/api/users', usersRoutes);
// Profile and users routes are also in linksRoutes but exposed at /api level
app.use('/api', linksRoutes);

// ===========================================
// 1. Home Route
// ===========================================
app.get('/', (req, res) => {
  res.type('html').send(`
    <h1>Link-Bio Backend</h1>
    <p>API is running. Useful endpoints:</p>
    <ul>
      <li><a href="/health">/health</a></li>
      <li>/api/auth/signup (POST)</li>
      <li>/api/auth/login (POST)</li>
      <li>/api/links (POST, protected)</li>
    </ul>
  `);
});


// ===========================================
// 2. Health Check Route
// ===========================================
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });
