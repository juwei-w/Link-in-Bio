const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Link = require('../models/Link');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get current user's links (private)
router.get('/', auth, async (req, res) => {
  try {
    const links = await Link.find({ userId: req.user.id }).sort({ order: 1, createdAt: 1 });
    res.json(links);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's public links by userId
router.get('/users/:userId/links', async (req, res) => {
  try {
    const links = await Link.find({ userId: req.params.userId, isActive: true }).sort({ order: 1, createdAt: 1 });
    res.json(links);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public profile by username
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const links = await Link.find({ userId: user._id, isActive: true }).sort({ order: 1, createdAt: 1 });
    
    res.json({
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      links
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create link (private)
router.post('/', auth, async (req, res) => {
  try {
    const { title, url, iconUrl, position } = req.body;
    const link = new Link({ userId: req.user.id, title, url, iconUrl, position });
    await link.save();
    res.json(link);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update link (private)
router.put('/:id', auth, async (req, res) => {
  try {
    const updated = await Link.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found or not authorized' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete link (private)
router.delete('/:id', auth, async (req, res) => {
  try {
    const removed = await Link.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!removed) return res.status(404).json({ message: 'Not found or not authorized' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get links for a user (public/private depending on use)
router.get('/user/:userId', async (req, res) => {
  try {
    const links = await Link.find({ userId: req.params.userId }).sort({ position: 1, createdAt: 1 });
    res.json(links);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Click tracking endpoint (public) with simple rate limit
const clickLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
router.post('/:id/click', clickLimiter, async (req, res) => {
  try {
    const link = await Link.findByIdAndUpdate(req.params.id, { $inc: { clicks: 1 } }, { new: true });
    if (!link) return res.status(404).json({ message: 'Link not found' });
    res.json({ success: true, clicks: link.clicks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
