const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// GET /api/theme - Get current user's theme
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      theme: user.theme || "light",
      themeColors: user.themeColors || {
        primary: "#FF6B6B",
        secondary: "#4ECDC4",
        background: "#FFFFFF",
        text: "#000000",
      },
      vibrancy: user.vibrancy || "subtle",
      cardStyle: user.cardStyle || "glass",
    });
  } catch (err) {
    console.error("Get theme error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/theme/public/:username - Get public user's theme (for profile page)
router.get("/public/:username", async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      theme: user.theme || "light",
      themeColors: user.themeColors || {
        primary: "#FF6B6B",
        secondary: "#4ECDC4",
        background: "#FFFFFF",
        text: "#000000",
      },
      vibrancy: user.vibrancy || "subtle",
      cardStyle: user.cardStyle || "glass",
    });
  } catch (err) {
    console.error("Get public theme error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/theme - Update theme and colors
// Body: { theme, themeColors: { primary, secondary, background, text } }
router.put("/", auth, async (req, res) => {
  try {
    const { theme, themeColors, vibrancy, cardStyle } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate theme value
    if (theme && !["light", "dark"].includes(theme)) {
      return res.status(400).json({ message: "Invalid theme value" });
    }

    // Validate color format (basic hex validation)
    if (themeColors) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      for (const [key, color] of Object.entries(themeColors)) {
        if (color && !colorRegex.test(color)) {
          return res.status(400).json({ message: `Invalid color format for ${key}` });
        }
      }
      user.themeColors = { ...user.themeColors, ...themeColors };
    }

    if (theme) {
      user.theme = theme;
    }

    if (vibrancy && ["subtle", "medium", "high"].includes(vibrancy)) {
      user.vibrancy = vibrancy;
    }

    if (cardStyle && ["glass", "solid", "retro"].includes(cardStyle)) {
      user.cardStyle = cardStyle;
    }

    await user.save();

    res.json({
      message: "Theme updated successfully",
      theme: user.theme,
      themeColors: user.themeColors,
      vibrancy: user.vibrancy,
      cardStyle: user.cardStyle,
    });
  } catch (err) {
    console.error("Update theme error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
