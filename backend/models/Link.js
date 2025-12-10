const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Click event schema for time-series analytics
const ClickEventSchema = new Schema({
  timestamp: { type: Date, default: Date.now, required: true },
  referrer: { type: String, default: 'direct' }, // Referrer URL or 'direct'
  userAgent: { type: String }, // Browser/device info
  country: { type: String }, // Country code (e.g., 'US', 'MY')
  city: { type: String }, // City name
  ipHash: { type: String }, // Hashed IP for privacy (optional unique visitor tracking)
}, { _id: true });

const LinkSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  iconUrl: { type: String },
  order: { type: Number, default: 0 },
  position: { type: Number, default: 0 }, // Keep for backwards compatibility
  clicks: { type: Number, default: 0 }, // Total click count
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  
  // Link Scheduling
  scheduledStart: { type: Date }, // When the link becomes active (UTC)
  scheduledEnd: { type: Date }, // When the link becomes inactive (UTC)
  
  // Advanced Analytics
  clickEvents: [ClickEventSchema], // Time-series click data
  lastClickedAt: { type: Date }, // Last click timestamp
  
  // Aggregated analytics (for faster queries)
  analytics: {
    dailyClicks: [{ 
      date: { type: String }, // Format: 'YYYY-MM-DD'
      count: { type: Number, default: 0 }
    }],
    // Unique visitors per day using ipHash
    dailyUniqueVisitors: [{
      date: { type: String }, // 'YYYY-MM-DD'
      count: { type: Number, default: 0 }
    }],
    topReferrers: [{
      source: { type: String },
      count: { type: Number, default: 0 }
    }],
    topCountries: [{
      country: { type: String },
      count: { type: Number, default: 0 }
    }],
    topCities: [{
      city: { type: String },
      count: { type: Number, default: 0 }
    }],
    // Device breakdown (mobile/desktop/tablet)
    devices: [{
      type: { type: String },
      count: { type: Number, default: 0 }
    }],
    // Platform breakdown (e.g., instagram.com, tiktok.com, whatsapp.com)
    platforms: [{
      name: { type: String },
      count: { type: Number, default: 0 }
    }],
    // Hourly clicks (0-23)
    hourlyClicks: [{
      hour: { type: Number },
      count: { type: Number, default: 0 }
    }]
  }
});

// Index for efficient time-series queries
LinkSchema.index({ 'clickEvents.timestamp': -1 });
LinkSchema.index({ userId: 1, order: 1 });

module.exports = mongoose.model('Link', LinkSchema);
