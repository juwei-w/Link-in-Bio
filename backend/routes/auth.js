const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { init } = require('../firebaseAdmin');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    // simple validation done by mongoose schema
    const existing = await User.findOne({ $or: [{ username: username.toLowerCase() }, { email }] });
    if (existing) return res.status(409).json({ message: 'Username or email already taken' });

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const user = new User({ username, email, passwordHash: hash, provider: 'local' });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// NOTE: OAuth routes (Google/GitHub) will be added later; for MVP we will accept provider tokens and create users.

// POST /api/auth/firebase
// Body: { idToken: string }
router.post('/firebase', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Missing idToken' });

    const admin = init();
    if (!admin) return res.status(501).json({ message: 'Firebase Admin not configured on server' });

    // verify token
    const decoded = await admin.auth().verifyIdToken(idToken);
    // decoded contains uid, email, name, picture, etc.

    const providerId = decoded.uid;
    const email = decoded.email;
    const usernameBase = (decoded.name || email || 'user').split(/[\s@]/)[0].toLowerCase();

    // find or create local user
    let user = await User.findOne({ $or: [{ providerId }, { email }] });
    if (!user) {
      // create a unique username by appending random suffix if needed
      let username = usernameBase.replace(/[^a-z0-9_-]/gi, '').slice(0, 12) || 'user';
      let attempt = username;
      let i = 0;
      while (await User.findOne({ username: attempt })) {
        i += 1;
        attempt = `${username}${i}`;
      }
      user = new User({ username: attempt, email, provider: 'firebase', providerId });
      await user.save();
    } else {
      // if found by email but no providerId, set it
      if (!user.providerId) {
        user.provider = 'firebase';
        user.providerId = providerId;
        await user.save();
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Firebase auth exchange error:', err);
    res.status(401).json({ message: 'Invalid Firebase token' });
  }
});

module.exports = router;
