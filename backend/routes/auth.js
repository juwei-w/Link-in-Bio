const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const axios = require("axios");
const User = require("../models/User");
const { init } = require("../firebaseAdmin");
const {
  isValidUsername,
  isValidEmail,
  isValidPassword,
} = require("../utils/validation");

// Configure mail transporter (defaults suitable for MailHog). If SMTP_* env vars
// are provided they will be used. Alternatively, if BREVO_API_KEY is set the
// Brevo HTTP API will be used instead of SMTP.
function createSmtpTransport() {
  const host = process.env.SMTP_HOST || "localhost";
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 1025;
  const secure = process.env.SMTP_SECURE === "true" || false;
  const authUser = process.env.SMTP_USER;
  const authPass = process.env.SMTP_PASS;

  const transportOpts = { host, port, secure };
  if (authUser && authPass)
    transportOpts.auth = { user: authUser, pass: authPass };
  return nodemailer.createTransport(transportOpts);
}

async function sendVerificationEmail(toEmail, verificationUrl) {
  const fromEmail = process.env.EMAIL_FROM || "no-reply@localhost";
  const fromName = process.env.EMAIL_FROM_NAME || "Link-in-Bio";
  const subject = "Verify your email address";
  const text = `Welcome! Click the link to verify your email address:\n\n${verificationUrl}\n\nIf you didn't create this account, ignore this email.`;
  const html = `<p>Welcome! Click the link to verify your email address:</p><p><a href="${verificationUrl}">Verify Email</a></p><p>If you didn't create this account, ignore this email.</p>`;

  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      const payload = {
        sender: { name: fromName, email: fromEmail },
        to: [{ email: toEmail }],
        subject,
        htmlContent: html,
        textContent: text,
      };
      const res = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        payload,
        {
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );
      console.log(
        "Verification email sent via Brevo to",
        toEmail,
        "status",
        res.status
      );
      return;
    } catch (err) {
      console.error(
        "Brevo API send failed:",
        err && err.response ? err.response.data : err && err.message
      );
    }
  }

  const transporter = createSmtpTransport();
  try {
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject,
      text,
      html,
    });
    console.log("Verification email sent to", toEmail);
  } catch (err) {
    console.error(
      "Failed sending verification email via SMTP:",
      err && err.message
    );
    throw err;
  }
}

async function sendResetEmail(toEmail, resetUrl) {
  const fromEmail = process.env.EMAIL_FROM || "no-reply@localhost";
  const fromName = process.env.EMAIL_FROM_NAME || "Link-in-Bio";
  const subject = "Reset your password";
  const text = `You requested a password reset. Click the link to reset your password:\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;
  const html = `<p>You requested a password reset. Click the link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, ignore this email.</p>`;

  // If BREVO_API_KEY is present, prefer Brevo HTTP API (no SMTP required)
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (brevoApiKey) {
    try {
      const payload = {
        sender: { name: fromName, email: fromEmail },
        to: [{ email: toEmail }],
        subject,
        htmlContent: html,
        textContent: text,
      };
      const res = await axios.post(
        "https://api.brevo.com/v3/smtp/email",
        payload,
        {
          headers: {
            "api-key": brevoApiKey,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );
      console.log(
        "Password reset email sent via Brevo to",
        toEmail,
        "status",
        res.status
      );
      return;
    } catch (err) {
      console.error(
        "Brevo API send failed:",
        err && err.response ? err.response.data : err && err.message
      );
      // Fall through to SMTP attempt if configured
    }
  }

  // Fallback to SMTP (MailHog by default). Create transporter on demand so tests
  // and environments can change env vars without restarting the server.
  const transporter = createSmtpTransport();
  try {
    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject,
      text,
      html,
    });
    console.log("Password reset email sent to", toEmail);
  } catch (err) {
    console.error("Failed sending reset email via SMTP:", err && err.message);
    throw err;
  }
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({
          message: "Missing required fields: username, email, password",
        });
    }

    // Validate format
    if (!isValidUsername(username)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid username. Must be 3-16 characters (letters, numbers, - and _)",
        });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!isValidPassword(password)) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check if username or email already taken
    const existing = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() },
      ],
    });
    if (existing) {
      if (existing.username === username.toLowerCase()) {
        return res.status(409).json({ message: "Username already taken" });
      }
      return res.status(409).json({ message: "Email already registered" });
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = Date.now() + 24 * 3600 * 1000; // 24 hours

    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash: hash,
      provider: "local",
      emailVerificationToken: verificationToken,
      emailVerificationExpires,
    });
    await user.save();

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:4200";
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      email
    )}`;

    try {
      await sendVerificationEmail(email, verifyUrl);
      console.log("Verification email sent for user:", email);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr.message);
      // Continue anyway; user can request resend later
    }

    // Return token but user must verify email before full access
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
      },
      message: "Signup successful. Please verify your email.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/check-username
// Query param: username
// Returns: { available: boolean, message: string }
router.get("/check-username", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username || username.trim().length < 3) {
      return res.json({
        available: false,
        message: "Username must be at least 3 characters",
      });
    }
    if (username.length > 16) {
      return res.json({
        available: false,
        message: "Username must be 16 characters or less",
      });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.json({
        available: false,
        message: "Username can only contain letters, numbers, - and _",
      });
    }

    const existing = await User.findOne({ username: username.toLowerCase() });
    if (existing) {
      return res.json({
        available: false,
        message: "Username is already taken",
      });
    }

    res.json({ available: true, message: "Username is available" });
  } catch (err) {
    console.error("Check username error:", err);
    res.status(500).json({ available: false, message: "Server error" });
  }
});

// GET /api/auth/check-email
// Query param: email
// Returns: { available: boolean, message: string }
router.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || !email.includes("@")) {
      return res.json({
        available: false,
        message: "Please enter a valid email",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({
        available: false,
        message: "Email is already registered",
      });
    }

    res.json({ available: true, message: "Email is available" });
  } catch (err) {
    console.error("Check email error:", err);
    res.status(500).json({ available: false, message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Missing required fields: email, password" });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash)
      return res.status(401).json({ message: "Invalid credentials" });

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/forgot
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.json({
        message: "If an account exists, a reset email has been sent",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // respond with success to avoid user enumeration
      return res.json({
        message: "If an account exists, a reset email has been sent",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600 * 1000; // 1 hour
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:4200";
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(
      email
    )}`;

    await sendResetEmail(email, resetUrl);
    res.json({ message: "If an account exists, a reset email has been sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/reset
// Body: { email, token, password }
router.post("/reset", async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    // Prevent reuse of recent passwords (check current + last N entries)
    const recentLimit = process.env.PASSWORD_HISTORY_LIMIT
      ? parseInt(process.env.PASSWORD_HISTORY_LIMIT)
      : 5;

    // helper to check candidate password against a stored hash
    async function matchesHash(candidate, hash) {
      try {
        return await bcrypt.compare(candidate, hash);
      } catch (e) {
        return false;
      }
    }

    // check against current password
    if (user.passwordHash) {
      const isSameAsCurrent = await matchesHash(password, user.passwordHash);
      if (isSameAsCurrent) {
        console.log(
          `Password reset blocked: user ${user.email} attempted to reuse current password`
        );
        return res.status(400).json({
          message: "New password must not be the same as your current password",
        });
      }
    }

    // check against password history (if any)
    if (Array.isArray(user.passwordHistory) && user.passwordHistory.length) {
      for (
        let i = 0;
        i < Math.min(user.passwordHistory.length, recentLimit);
        i++
      ) {
        const histHash = user.passwordHistory[i];
        const isMatch = await matchesHash(password, histHash);
        if (isMatch) {
          console.log(
            `Password reset blocked: user ${user.email} attempted to reuse historical password at index ${i}`
          );
          return res.status(400).json({
            message: `New password must not match your last ${recentLimit} passwords`,
          });
        }
      }
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    // push current password into history (if exists) and trim history
    if (user.passwordHash) {
      // ensure array exists
      user.passwordHistory = user.passwordHistory || [];
      // prepend current hash to history
      user.passwordHistory.unshift(user.passwordHash);
      // keep only most recent `recentLimit` entries
      if (user.passwordHistory.length > recentLimit) {
        user.passwordHistory = user.passwordHistory.slice(0, recentLimit);
      }
    }

    // set new password
    user.passwordHash = hash;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token: jwtToken,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// NOTE: OAuth routes (Google/GitHub) will be added later; for MVP we will accept provider tokens and create users.

// POST /api/auth/firebase
// Body: { idToken: string }
router.post("/firebase", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing idToken" });

    const admin = init();
    if (!admin)
      return res
        .status(501)
        .json({ message: "Firebase Admin not configured on server" });

    // verify token
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
      console.log("Firebase token decoded:", {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      });
    } catch (verifyError) {
      console.error(
        "Token verification failed:",
        verifyError.code,
        verifyError.message
      );
      return res.status(401).json({
        message: "Invalid Firebase token",
        error: verifyError.message,
        code: verifyError.code,
      });
    }

    const providerId = decoded.uid;
    const email = decoded.email;
    // Replace spaces with hyphens and clean username
    const usernameBase = (decoded.name || email || "user")
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .split("@")[0] // Take part before @ if email
      .replace(/[^a-z0-9_-]/gi, ""); // Remove invalid characters

    // find or create local user
    let user = await User.findOne({ $or: [{ providerId }, { email }] });
    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      // create a unique username by appending random suffix if needed
      let username = usernameBase.slice(0, 12) || "user";
      // Ensure username is at least 3 characters (mongoose validation requirement)
      if (username.length < 3) {
        username = username + Math.floor(Math.random() * 1000);
      }
      let attempt = username;
      let i = 0;
      while (await User.findOne({ username: attempt })) {
        i += 1;
        attempt = `${username}${i}`;
      }
      user = new User({
        username: attempt,
        email,
        provider: "firebase",
        providerId,
        emailVerificationToken: crypto.randomBytes(32).toString("hex"),
        emailVerificationExpires: Date.now() + 24 * 3600 * 1000,
      });
      await user.save();
      console.log("Created new user:", {
        username: user.username,
        email: user.email,
        providerId: user.providerId,
      });

      // Send verification email for new Firebase users
      const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:4200";
      const verifyUrl = `${frontendUrl}/verify-email?token=${
        user.emailVerificationToken
      }&email=${encodeURIComponent(email)}`;
      try {
        await sendVerificationEmail(email, verifyUrl);
        console.log("Verification email sent for new Firebase user:", email);
      } catch (emailErr) {
        console.error("Failed to send verification email:", emailErr.message);
      }
    } else {
      // if found by email but no providerId, set it
      if (!user.providerId) {
        user.provider = "firebase";
        user.providerId = providerId;
        await user.save();
        console.log("Updated existing user with providerId:", {
          username: user.username,
          email: user.email,
          providerId: user.providerId,
        });
      } else {
        console.log("Found existing user:", {
          username: user.username,
          email: user.email,
          providerId: user.providerId,
        });
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token,
      isNewUser, // Flag to indicate new user needs to verify email
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (err) {
    console.error("Firebase auth exchange error:", err);
    res.status(500).json({ message: "Server error during authentication" });
  }
});

// POST /api/auth/verify-email
// Body: { email, token }
router.post("/verify-email", async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token)
      return res.status(400).json({ message: "Missing email or token" });

    const user = await User.findOne({
      email,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    console.log("Email verified for user:", user.email);

    // Return updated user info
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
      },
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/resend-verification
// Body: { email }
// Re-send verification email to user
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const user = await User.findOne({ email });
    if (!user)
      return res.json({
        message: "If an account exists, verification email has been sent",
      });

    // If already verified, no need to send again
    if (user.emailVerified) {
      return res.json({ message: "Email already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 3600 * 1000; // 24 hours
    await user.save();

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:4200";
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      email
    )}`;

    try {
      await sendVerificationEmail(email, verifyUrl);
      console.log("Verification email resent to:", email);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr.message);
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }

    res.json({
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Check if username is available
router.post("/check-username", async (req, res) => {
  try {
    const { username } = req.body;

    console.debug("[auth] check-username called with:", username);

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Username validation regex (same as in User model)
    const USERNAME_REGEX = /^[a-z0-9_-]{3,16}$/i;
    if (!USERNAME_REGEX.test(username)) {
      return res.json({ available: false });
    }

    // Check if username exists in database (excluding current user if updating)
    const existingUser = await User.findOne({
      username: username.toLowerCase(),
    });

    res.json({ available: !existingUser });
  } catch (err) {
    console.error("Check username error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
