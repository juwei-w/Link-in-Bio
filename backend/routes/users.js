const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");
const {
  isValidUsername,
  isValidDisplayName,
  isValidBio,
  isValidImageUrl,
} = require("../utils/validation");

// GET /api/users/me - Get current user profile
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/me - Update current user profile
router.put("/me", auth, async (req, res) => {
  try {
    const { username, displayName, bio, avatarUrl, theme } = req.body;
    const updateData = {};

    // Only update fields that are provided
    if (username !== undefined) {
      // Validate username
      if (!isValidUsername(username)) {
        return res
          .status(400)
          .json({
            message:
              "Invalid username. Must be 3-16 characters (letters, numbers, - and _)",
          });
      }

      // Check if username is already taken by another user
      const existing = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: req.user.id },
      });
      if (existing) {
        return res.status(409).json({ message: "Username already taken" });
      }
      updateData.username = username.toLowerCase();
    }

    // Validate display name if provided
    if (displayName !== undefined) {
      if (!isValidDisplayName(displayName)) {
        return res
          .status(400)
          .json({ message: "Invalid display name. Max 100 characters" });
      }
      updateData.displayName = displayName;
    }

    // Validate bio if provided
    if (bio !== undefined) {
      if (!isValidBio(bio)) {
        return res
          .status(400)
          .json({ message: "Invalid bio. Max 500 characters" });
      }
      updateData.bio = bio;
    }

    // Handle avatar upload to Cloudinary
    if (avatarUrl !== undefined) {
      if (avatarUrl === "") {
        // Empty string means remove avatar
        const user = await User.findById(req.user.id);
        if (user && user.avatarUrl) {
          // Extract public_id from Cloudinary URL and delete
          const publicIdMatch = user.avatarUrl.match(/\/avatars\/([^/.]+)/);
          if (publicIdMatch) {
            try {
              await cloudinary.uploader.destroy(`avatars/${publicIdMatch[1]}`);
              console.log("Deleted old avatar from Cloudinary");
            } catch (err) {
              console.error("Failed to delete from Cloudinary:", err);
            }
          }
        }
        updateData.avatarUrl = "";
      } else if (avatarUrl.startsWith("data:image")) {
        // Upload base64 image to Cloudinary
        try {
          const user = await User.findById(req.user.id);

          // Delete old avatar from Cloudinary if exists
          if (user && user.avatarUrl) {
            const publicIdMatch = user.avatarUrl.match(/\/avatars\/([^/.]+)/);
            if (publicIdMatch) {
              try {
                await cloudinary.uploader.destroy(
                  `avatars/${publicIdMatch[1]}`
                );
              } catch (err) {
                console.error("Failed to delete old avatar:", err);
              }
            }
          }

          // Upload new avatar to Cloudinary
          const result = await cloudinary.uploader.upload(avatarUrl, {
            folder: "avatars",
            public_id: `user-${req.user.id}-${Date.now()}`,
            transformation: [
              { width: 300, height: 300, crop: "fill", gravity: "face" },
              { quality: "auto" },
            ],
          });

          updateData.avatarUrl = result.secure_url;
          console.log("Avatar uploaded to Cloudinary:", result.secure_url);
        } catch (err) {
          console.error("Error uploading to Cloudinary:", err);
          return res
            .status(400)
            .json({ message: "Failed to upload avatar image" });
        }
      } else if (avatarUrl.startsWith("http")) {
        // Already a URL, use as-is
        updateData.avatarUrl = avatarUrl;
      }
    }

    if (theme !== undefined && ["light", "dark"].includes(theme)) {
      updateData.theme = theme;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
