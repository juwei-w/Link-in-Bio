const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const USERNAME_REGEX = /^[a-z0-9_-]{3,16}$/i;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 16,
    match: USERNAME_REGEX,
  },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  displayName: { type: String },
  avatarUrl: { type: String },
  bio: { type: String },
  theme: { type: String, enum: ["light", "dark"], default: "light" },
  provider: {
    type: String,
    enum: ["local", "google", "github", "firebase"],
    default: "local",
  },
  providerId: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // store previous password hashes to prevent reuse (most recent first)
  passwordHistory: [{ type: String }],
  createdAt: { type: Date, default: Date.now },

  // Profile Analytics for CTR
  totalProfileViews: { type: Number, default: 0 },
  analytics: {
    profileDailyViews: [{
      date: { type: String }, // 'YYYY-MM-DD'
      count: { type: Number, default: 0 }
    }]
  }
});

// normalize username to lowercase
UserSchema.pre("save", function (next) {
  if (this.username) this.username = this.username.toLowerCase();
  next();
});

module.exports = mongoose.model("User", UserSchema);
