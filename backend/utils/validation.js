/**
 * Validation utilities for API requests
 */

// Validate username: 3-16 characters, alphanumeric + underscore + dash
function isValidUsername(username) {
  if (!username || typeof username !== "string") return false;
  const trimmed = username.trim();
  return /^[a-zA-Z0-9_-]{3,16}$/.test(trimmed);
}

// Validate email format
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  // Simple email regex - covers most cases
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Validate password: minimum 6 characters
function isValidPassword(password) {
  if (!password || typeof password !== "string") return false;
  return password.length >= 6;
}

// Validate URL
function isValidUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Validate title (non-empty, max 200 chars)
function isValidTitle(title) {
  if (!title || typeof title !== "string") return false;
  const trimmed = title.trim();
  return trimmed.length > 0 && trimmed.length <= 200;
}

// Validate bio (max 500 chars)
function isValidBio(bio) {
  if (!bio) return true; // Optional
  if (typeof bio !== "string") return false;
  return bio.length <= 500;
}

// Validate display name (max 100 chars)
function isValidDisplayName(displayName) {
  if (!displayName) return true; // Optional
  if (typeof displayName !== "string") return false;
  return displayName.length <= 100;
}

// Validate order/position (non-negative integer)
function isValidOrder(order) {
  if (order === undefined || order === null) return true; // Optional
  return Number.isInteger(order) && order >= 0;
}

// Validate scheduled dates
function isValidScheduledDates(scheduledStart, scheduledEnd) {
  if (!scheduledStart && !scheduledEnd) return true; // Both optional

  if (scheduledStart) {
    const start = new Date(scheduledStart);
    if (isNaN(start.getTime())) return false;
  }

  if (scheduledEnd) {
    const end = new Date(scheduledEnd);
    if (isNaN(end.getTime())) return false;
  }

  if (scheduledStart && scheduledEnd) {
    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);
    if (end <= start) return false; // End must be after start
  }

  return true;
}

// Validate image URL
function isValidImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const parsedUrl = new URL(url);
    // Check if URL points to common image extensions
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
    const path = parsedUrl.pathname.toLowerCase();
    return (
      imageExtensions.some((ext) => path.endsWith(ext)) ||
      parsedUrl.hostname.includes("cloudinary") ||
      parsedUrl.hostname.includes("imgur") ||
      parsedUrl.hostname.includes("unsplash")
    );
  } catch {
    return false;
  }
}

module.exports = {
  isValidUsername,
  isValidEmail,
  isValidPassword,
  isValidUrl,
  isValidTitle,
  isValidBio,
  isValidDisplayName,
  isValidOrder,
  isValidScheduledDates,
  isValidImageUrl,
};
