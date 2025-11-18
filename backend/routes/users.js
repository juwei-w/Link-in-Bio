const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/users/me - Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/me - Update current user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { username, displayName, bio, avatarUrl, theme } = req.body;
    const updateData = {};

    // Only update fields that are provided
    if (username !== undefined) {
      // Check if username is already taken by another user
      const existing = await User.findOne({ 
        username: username.toLowerCase(), 
        _id: { $ne: req.user.id } 
      });
      if (existing) {
        return res.status(409).json({ message: 'Username already taken' });
      }
      updateData.username = username.toLowerCase();
    }
    
    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (theme !== undefined && ['light', 'dark'].includes(theme)) {
      updateData.theme = theme;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
