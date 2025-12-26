const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const Link = require("../models/Link");
const User = require("../models/User");
const auth = require("../middleware/auth");
const {
  getLocationFromIP,
  hashIP,
  extractReferrerDomain,
  getClientIP,
} = require("../utils/geolocation");
const { fetchFavicon, isValidImageUrl } = require("../utils/faviconFetch");
const {
  isValidTitle,
  isValidUrl,
  isValidBio,
  isValidDisplayName,
  isValidOrder,
  isValidScheduledDates,
} = require("../utils/validation");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");

// Use memory storage for small icon uploads (allow up to 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Helper function to check if a link is currently active based on scheduling
const isLinkActive = (link) => {
  if (!link.isActive) return false;

  const now = new Date();

  // Check if link has a scheduled start time
  if (link.scheduledStart && now < new Date(link.scheduledStart)) {
    return false; // Link hasn't started yet
  }

  // Check if link has a scheduled end time
  if (link.scheduledEnd && now > new Date(link.scheduledEnd)) {
    return false; // Link has ended
  }

  return true;
};

// Get current user's links (private)
router.get("/", auth, async (req, res) => {
  try {
    const links = await Link.find({ userId: req.user.id }).sort({
      order: 1,
      createdAt: 1,
    });
    res.json(links);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get user's public links by userId
router.get("/users/:userId/links", async (req, res) => {
  try {
    const allLinks = await Link.find({
      userId: req.params.userId,
      isActive: true,
    }).sort({ order: 1, createdAt: 1 });
    // Filter links based on scheduling
    const links = allLinks.filter((link) => isLinkActive(link));
    res.json(links);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get public profile by username
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const allLinks = await Link.find({ userId: user._id, isActive: true }).sort(
      { order: 1, createdAt: 1 }
    );
    // Filter links based on scheduling
    const links = allLinks.filter((link) => isLinkActive(link));

    // Optional tracking of a profile view for CTR
    const trackView = req.query.trackView === "1";
    if (trackView) {
      const today = new Date().toISOString().split("T")[0];
      user.totalProfileViews = (user.totalProfileViews || 0) + 1;
      if (!user.analytics) user.analytics = { profileDailyViews: [] };
      if (!user.analytics.profileDailyViews)
        user.analytics.profileDailyViews = [];
      const pvIndex = user.analytics.profileDailyViews.findIndex(
        (d) => d.date === today
      );
      if (pvIndex >= 0) {
        user.analytics.profileDailyViews[pvIndex].count += 1;
      } else {
        user.analytics.profileDailyViews.push({ date: today, count: 1 });
        if (user.analytics.profileDailyViews.length > 90) {
          user.analytics.profileDailyViews =
            user.analytics.profileDailyViews.slice(-90);
        }
      }
      await user.save();
    }

    res.json({
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      totalProfileViews: user.totalProfileViews || 0,
      profileDailyViews: user.analytics?.profileDailyViews || [],
      links,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create link (private)
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      url,
      iconUrl,
      position,
      order,
      scheduledStart,
      scheduledEnd,
    } = req.body;

    // Validate required fields
    if (!title || !url) {
      return res
        .status(400)
        .json({ message: "Missing required fields: title, url" });
    }

    // Validate title
    if (!isValidTitle(title)) {
      return res
        .status(400)
        .json({ message: "Invalid title. Max 200 characters" });
    }

    // Validate URL
    if (!isValidUrl(url)) {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    // Validate optional icon URL
    if (iconUrl && !isValidImageUrl(iconUrl)) {
      return res.status(400).json({ message: "Invalid icon URL format" });
    }

    // Validate order
    if (!isValidOrder(order)) {
      return res
        .status(400)
        .json({ message: "Invalid order. Must be a non-negative integer" });
    }

    // Validate scheduled dates
    if (!isValidScheduledDates(scheduledStart, scheduledEnd)) {
      return res
        .status(400)
        .json({ message: "Invalid scheduled dates. End must be after start" });
    }

    const link = new Link({
      userId: req.user.id,
      title,
      url,
      iconUrl,
      position,
      order,
      scheduledStart,
      scheduledEnd,
    });
    await link.save();
    res.status(201).json(link);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update link (private)
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, url, iconUrl, order, scheduledStart, scheduledEnd } =
      req.body;

    // Validate title if provided
    if (title !== undefined && !isValidTitle(title)) {
      return res
        .status(400)
        .json({ message: "Invalid title. Max 200 characters" });
    }

    // Validate URL if provided
    if (url !== undefined && !isValidUrl(url)) {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    // Validate icon URL if provided
    if (
      iconUrl !== undefined &&
      iconUrl !== null &&
      !isValidImageUrl(iconUrl)
    ) {
      return res.status(400).json({ message: "Invalid icon URL format" });
    }

    // Validate order if provided
    if (order !== undefined && !isValidOrder(order)) {
      return res
        .status(400)
        .json({ message: "Invalid order. Must be a non-negative integer" });
    }

    // Validate scheduled dates
    if (!isValidScheduledDates(scheduledStart, scheduledEnd)) {
      return res
        .status(400)
        .json({ message: "Invalid scheduled dates. End must be after start" });
    }

    const updated = await Link.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated)
      return res.status(404).json({ message: "Not found or not authorized" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete link (private)
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate link ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid link ID format" });
    }

    const removed = await Link.findOneAndDelete({
      _id: id,
      userId: req.user.id,
    });
    if (!removed)
      return res.status(404).json({ message: "Not found or not authorized" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get links for a user (public/private depending on use)
router.get("/user/:userId", async (req, res) => {
  try {
    const links = await Link.find({ userId: req.params.userId }).sort({
      position: 1,
      createdAt: 1,
    });
    res.json(links);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get analytics for a specific link (private)
router.get("/:id/analytics", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query; // Default to last 30 days

    // Validate link ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid link ID format" });
    }

    // Validate days parameter
    const parsedDays = parseInt(days, 10);
    // Allow 0 (All Time) or 1-365
    if (isNaN(parsedDays) || (parsedDays !== 0 && (parsedDays < 1 || parsedDays > 365))) {
      return res.status(400).json({
        message: "Invalid days parameter. Must be 0 (All Time) or between 1 and 365",
      });
    }

    const link = await Link.findOne({
      _id: id,
      userId: req.user.id,
    });
    if (!link)
      return res.status(404).json({ message: "Not found or not authorized" });

    // Get date range
    const startDate = new Date();
    if (parsedDays === 0) {
      startDate.setTime(0);
    } else {
      startDate.setDate(startDate.getDate() - parsedDays);
    }

    // Filter click events by date range
    const recentClicks =
      link.clickEvents?.filter(
        (click) => new Date(click.timestamp) >= startDate
      ) || [];

    // Calculate time-series data (daily clicks)
    const dailyData = {};
    recentClicks.forEach((click) => {
      const date = new Date(click.timestamp).toISOString().split("T")[0];
      dailyData[date] = (dailyData[date] || 0) + 1;
    });

    // Fill missing dates with 0
    const timeSeriesData = [];
    if (parsedDays === 0) {
      Object.keys(dailyData).sort().forEach(date => {
        timeSeriesData.push({ date, clicks: dailyData[date] });
      });
    } else {
      for (let i = parsedDays - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        timeSeriesData.push({
          date: dateStr,
          clicks: dailyData[dateStr] || 0,
        });
      }
    }

    // Calculate referrer stats
    const referrerStats = {};
    recentClicks.forEach((click) => {
      const ref = click.referrer || "direct";
      referrerStats[ref] = (referrerStats[ref] || 0) + 1;
    });
    const topReferrers = Object.entries(referrerStats)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate geography stats
    const countryStats = {};
    const cityStats = {};
    // Device & platform stats (per link)
    const deviceStats = {};
    const platformStats = {};
    recentClicks.forEach((click) => {
      if (click.country) {
        countryStats[click.country] = (countryStats[click.country] || 0) + 1;
      }
      if (click.city) {
        cityStats[click.city] = (cityStats[click.city] || 0) + 1;
      }
      // Derive device from UA
      const ua = (click.userAgent || "").toLowerCase();
      const isMobile = /iphone|android|mobile/.test(ua);
      const isTablet = /ipad|tablet/.test(ua);
      const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
      deviceStats[deviceType] = (deviceStats[deviceType] || 0) + 1;
      // Platform from referrer
      const ref = click.referrer || "direct";
      if (ref && ref !== "direct") {
        platformStats[ref] = (platformStats[ref] || 0) + 1;
      }
    });

    const topCountries = Object.entries(countryStats)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCities = Object.entries(cityStats)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const devices = Object.entries(deviceStats)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    const platforms = Object.entries(platformStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Hourly clicks based on recent clicks
    const hourlyClicks = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: 0,
    }));
    recentClicks.forEach((click) => {
      const h = new Date(click.timestamp).getHours();
      hourlyClicks[h].count += 1;
    });

    res.json({
      linkId: link._id,
      title: link.title,
      totalClicks: link.clicks,
      timeRange: { days: parseInt(days), clicksInRange: recentClicks.length },
      timeSeries: timeSeriesData,
      topReferrers,
      topCountries,
      topCities,
      devices,
      platforms,
      hourlyClicks,
      lastClickedAt: link.lastClickedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get aggregated analytics for all user's links (private)
router.get("/analytics/overview", auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const links = await Link.find({ userId: req.user.id });

    const daysInt = parseInt(days);
    const startDate = new Date();

    if (daysInt === 0) {
      startDate.setTime(0); // Epoch
    } else {
      startDate.setDate(startDate.getDate() - daysInt);
    }

    let totalClicks = 0;
    const dailyData = {};
    const referrerStats = {};
    const countryStats = {};
    const cityStats = {};
    const deviceStats = {};
    const platformStats = {};
    const hourlyClicks = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: 0,
    }));

    links.forEach((link) => {
      // Filter recent clicks first
      const recentClicks =
        link.clickEvents?.filter(
          (click) => new Date(click.timestamp) >= startDate
        ) || [];

      // Sum only recent clicks
      totalClicks += recentClicks.length;

      recentClicks.forEach((click) => {
        // Daily aggregation
        const date = new Date(click.timestamp).toISOString().split("T")[0];
        dailyData[date] = (dailyData[date] || 0) + 1;

        // Referrer aggregation
        const ref = click.referrer || "direct";
        referrerStats[ref] = (referrerStats[ref] || 0) + 1;

        // Country aggregation
        if (click.country) {
          countryStats[click.country] = (countryStats[click.country] || 0) + 1;
        }

        // City aggregation
        if (click.city) {
          cityStats[click.city] = (cityStats[click.city] || 0) + 1;
        }

        // Device aggregation
        const ua = (click.userAgent || "").toLowerCase();
        const isMobile = /iphone|android|mobile/.test(ua);
        const isTablet = /ipad|tablet/.test(ua);
        const deviceType = isTablet
          ? "tablet"
          : isMobile
            ? "mobile"
            : "desktop";
        deviceStats[deviceType] = (deviceStats[deviceType] || 0) + 1;

        // Platform aggregation (referrer domain)
        if (ref && ref !== "direct") {
          platformStats[ref] = (platformStats[ref] || 0) + 1;
        }

        // Hourly aggregation
        const h = new Date(click.timestamp).getHours();
        hourlyClicks[h].count += 1;
      });
    });

    // Format time series
    const timeSeriesData = [];
    if (daysInt === 0) {
      // For all time, sort available dates
      Object.keys(dailyData).sort().forEach(date => {
        timeSeriesData.push({ date, clicks: dailyData[date] });
      });
    } else {
      for (let i = daysInt - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        timeSeriesData.push({
          date: dateStr,
          clicks: dailyData[dateStr] || 0,
        });
      }
    }

    const topReferrers = Object.entries(referrerStats)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topCountries = Object.entries(countryStats)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const topCities = Object.entries(cityStats)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const devices = Object.entries(deviceStats)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    const platforms = Object.entries(platformStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Calculate per-link stats for the range
    let linkStats = [];
    try {
      linkStats = links.map(link => {
        const recent = (link.clickEvents || []).filter(
          (click) => new Date(click.timestamp) >= startDate
        );
        return { id: link._id, clicks: recent.length };
      });
    } catch (e) {
      console.error("Link stats error", e);
    }

    res.json({
      totalClicks,
      totalLinks: links.length,
      activeLinks: links.filter((l) => l.isActive).length,
      timeRange: { days: parseInt(days) },
      timeSeries: timeSeriesData,
      topReferrers,
      topCountries,
      topCities, // Added topCities for chart if needed
      devices,
      platforms,
      hourlyClicks,
      linkStats, // Return filtered specific link counts
      topPerformers: links
        .map((l) => ({ id: l._id, title: l.title, clicks: l.clicks }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Click tracking endpoint (public) with simple rate limit
const clickLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
router.post("/:id/click", clickLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate link ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid link ID format" });
    }

    // Derive referrer, IP, userAgent
    const incomingReferrer =
      req.body?.referrer ||
      req.headers["referer"] ||
      req.headers["referrer"] ||
      "direct";
    const referrer = extractReferrerDomain(incomingReferrer);
    const userAgent = req.headers["user-agent"] || "unknown";
    const ip = getClientIP(req);
    const ipHash = hashIP(ip);

    // Geolocation (dev returns nulls; replace with provider for prod)
    let { country, city } = await getLocationFromIP(ip);

    // For development/localhost, use test data so analytics populate
    if (
      !country &&
      (ip === "127.0.0.1" || ip === "::1" || ip?.startsWith("192.168."))
    ) {
      country = "MY"; // Malaysia for testing
      city = "Kuala Lumpur";
    }

    // Create click event
    const clickEvent = {
      timestamp: new Date(),
      referrer,
      userAgent,
      country: country || null,
      city: city || null,
      ipHash: ipHash || null,
    };

    // Derive device type (simple heuristic)
    const ua = userAgent.toLowerCase();
    const isMobile = /iphone|android|mobile/.test(ua);
    const isTablet = /ipad|tablet/.test(ua);
    const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

    // Map platform from referrer domain
    const platformMap = {
      "instagram.com": "Instagram",
      "tiktok.com": "TikTok",
      "facebook.com": "Facebook",
      "twitter.com": "Twitter",
      "x.com": "Twitter",
      "whatsapp.com": "WhatsApp",
      "youtube.com": "YouTube",
      "linkedin.com": "LinkedIn",
    };
    const platformName =
      platformMap[referrer] || (referrer !== "direct" ? referrer : null);

    // Current date for daily aggregation
    const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

    // Update link with click event and aggregated data
    const link = await Link.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { clicks: 1 },
        $push: { clickEvents: { $each: [clickEvent], $slice: -1000 } }, // Keep last 1000 events
        $set: { lastClickedAt: new Date() },
      },
      { new: true }
    );

    if (!link) return res.status(404).json({ message: "Link not found" });

    // Ensure analytics object exists
    if (!link.analytics)
      link.analytics = {
        dailyClicks: [],
        topReferrers: [],
        topCountries: [],
        topCities: [],
      };

    // Update daily clicks aggregation
    const dailyClickIndex = link.analytics.dailyClicks?.findIndex(
      (d) => d.date === today
    );
    if (dailyClickIndex >= 0) {
      link.analytics.dailyClicks[dailyClickIndex].count += 1;
    } else {
      if (!link.analytics.dailyClicks) link.analytics.dailyClicks = [];
      link.analytics.dailyClicks.push({ date: today, count: 1 });
      // Keep only last 90 days
      if (link.analytics.dailyClicks.length > 90) {
        link.analytics.dailyClicks = link.analytics.dailyClicks.slice(-90);
      }
    }

    // Update daily unique visitors using ipHash
    if (ipHash) {
      if (!link.analytics.dailyUniqueVisitors)
        link.analytics.dailyUniqueVisitors = [];
      // For uniqueness per day, check last N events for same day + ipHash
      const hasVisitedToday = (link.clickEvents || []).some(
        (e) =>
          e.ipHash === ipHash &&
          new Date(e.timestamp).toISOString().split("T")[0] === today
      );
      if (!hasVisitedToday) {
        const duIndex = link.analytics.dailyUniqueVisitors.findIndex(
          (d) => d.date === today
        );
        if (duIndex >= 0) {
          link.analytics.dailyUniqueVisitors[duIndex].count += 1;
        } else {
          link.analytics.dailyUniqueVisitors.push({ date: today, count: 1 });
          if (link.analytics.dailyUniqueVisitors.length > 90) {
            link.analytics.dailyUniqueVisitors =
              link.analytics.dailyUniqueVisitors.slice(-90);
          }
        }
      }
    }

    // Update referrer aggregation
    if (referrer && referrer !== "direct") {
      if (!link.analytics.topReferrers) link.analytics.topReferrers = [];
      const refIndex = link.analytics.topReferrers.findIndex(
        (r) => r.source === referrer
      );
      if (refIndex >= 0) {
        link.analytics.topReferrers[refIndex].count += 1;
      } else {
        link.analytics.topReferrers.push({ source: referrer, count: 1 });
      }
      // Keep top 10 referrers
      link.analytics.topReferrers.sort((a, b) => b.count - a.count);
      link.analytics.topReferrers = link.analytics.topReferrers.slice(0, 10);
    }

    // Update country aggregation
    if (country) {
      if (!link.analytics.topCountries) link.analytics.topCountries = [];
      const countryIndex = link.analytics.topCountries.findIndex(
        (c) => c.country === country
      );
      if (countryIndex >= 0) {
        link.analytics.topCountries[countryIndex].count += 1;
      } else {
        link.analytics.topCountries.push({ country, count: 1 });
      }
      link.analytics.topCountries.sort((a, b) => b.count - a.count);
      link.analytics.topCountries = link.analytics.topCountries.slice(0, 10);
    }

    // Update city aggregation
    if (city) {
      if (!link.analytics.topCities) link.analytics.topCities = [];
      const cityIndex = link.analytics.topCities.findIndex(
        (c) => c.city === city
      );
      if (cityIndex >= 0) {
        link.analytics.topCities[cityIndex].count += 1;
      } else {
        link.analytics.topCities.push({ city, count: 1 });
      }
      link.analytics.topCities.sort((a, b) => b.count - a.count);
      link.analytics.topCities = link.analytics.topCities.slice(0, 10);
    }

    // Update device breakdown
    if (!link.analytics.devices) link.analytics.devices = [];
    const devIndex = link.analytics.devices.findIndex(
      (d) => d.type === deviceType
    );
    if (devIndex >= 0) {
      link.analytics.devices[devIndex].count += 1;
    } else {
      link.analytics.devices.push({ type: deviceType, count: 1 });
    }

    // Update platform breakdown
    if (platformName) {
      if (!link.analytics.platforms) link.analytics.platforms = [];
      const platIndex = link.analytics.platforms.findIndex(
        (p) => p.name === platformName
      );
      if (platIndex >= 0) {
        link.analytics.platforms[platIndex].count += 1;
      } else {
        link.analytics.platforms.push({ name: platformName, count: 1 });
      }
      // Keep top 12 platforms
      link.analytics.platforms.sort((a, b) => b.count - a.count);
      link.analytics.platforms = link.analytics.platforms.slice(0, 12);
    }

    // Update hourly clicks (0-23)
    const hour = new Date().getHours();
    if (!link.analytics.hourlyClicks) link.analytics.hourlyClicks = [];
    const hourIndex = link.analytics.hourlyClicks.findIndex(
      (h) => h.hour === hour
    );
    if (hourIndex >= 0) {
      link.analytics.hourlyClicks[hourIndex].count += 1;
    } else {
      link.analytics.hourlyClicks.push({ hour, count: 1 });
    }

    await link.save();

    res.json({ success: true, clicks: link.clicks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Auto-fetch favicon for a link URL (private)
router.post("/:id/fetch-icon", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate link ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid link ID format" });
    }

    const link = await Link.findOne({
      _id: id,
      userId: req.user.id,
    });
    if (!link)
      return res.status(404).json({ message: "Not found or not authorized" });

    // Fetch favicon for the link's URL
    const faviconUrl = await fetchFavicon(link.url);

    if (faviconUrl) {
      link.iconUrl = faviconUrl;
      await link.save();
      res.json({ success: true, iconUrl: faviconUrl });
    } else {
      res.status(404).json({ message: "Could not find favicon for this URL" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Preview favicon for any URL (private) - No Link ID required
router.post("/preview-icon", auth, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ message: "Invalid or missing URL" });
    }

    const faviconUrl = await fetchFavicon(url);

    if (faviconUrl) {
      res.json({ success: true, iconUrl: faviconUrl });
    } else {
      res.status(404).json({ message: "Could not find favicon for this URL" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload a custom icon image for a link (private)
// Accepts multipart/form-data with field `icon`
router.post(
  "/:id/upload-icon",
  auth,
  upload.single("icon"),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Validate link ID format (MongoDB ObjectId)
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid link ID format" });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ message: "No file uploaded (field name: icon)" });
      }

      // Basic file type validation
      if (!req.file.mimetype || !req.file.mimetype.startsWith("image/")) {
        return res
          .status(400)
          .json({ message: "Uploaded file is not an image" });
      }

      // Validate file size (max 5MB)
      if (req.file.size > 5 * 1024 * 1024) {
        return res
          .status(400)
          .json({ message: "File size must not exceed 5MB" });
      }

      const link = await Link.findOne({
        _id: id,
        userId: req.user.id,
      });
      if (!link)
        return res.status(404).json({ message: "Not found or not authorized" });

      // Convert buffer to base64 data URI for Cloudinary upload
      const mime = req.file.mimetype || "image/png";
      const b64 = req.file.buffer.toString("base64");
      const dataUri = `data:${mime};base64,${b64}`;

      let uploadResult;
      try {
        uploadResult = await cloudinary.uploader.upload(dataUri, {
          folder: "link_icons",
          resource_type: "image",
          quality: "auto",
        });
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(502).json({
          message: "Cloudinary upload failed",
          details: uploadErr.message || uploadErr,
        });
      }

      if (!uploadResult || !uploadResult.secure_url) {
        console.error("Cloudinary returned no secure_url", uploadResult);
        return res
          .status(500)
          .json({ message: "Failed to upload image", details: uploadResult });
      }

      link.iconUrl = uploadResult.secure_url;
      await link.save();
      res.json({ success: true, iconUrl: link.iconUrl });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ message: "Server error", details: err.message || err });
    }
  }
);

// Auto-fetch icons for all user's links (private, bulk operation) - MUST COME BEFORE /:id routes
router.post("/fetch-icons/all", auth, async (req, res) => {
  try {
    const links = await Link.find({ userId: req.user.id });
    const results = [];

    for (const link of links) {
      try {
        if (!link.iconUrl) {
          // Only fetch if no icon already set
          const faviconUrl = await fetchFavicon(link.url);
          if (faviconUrl) {
            link.iconUrl = faviconUrl;
            await link.save();
            results.push({
              linkId: link._id,
              success: true,
              iconUrl: faviconUrl,
            });
          } else {
            results.push({
              linkId: link._id,
              success: false,
              message: "No favicon found",
            });
          }
        }
      } catch (err) {
        results.push({
          linkId: link._id,
          success: false,
          message: err.message,
        });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// (platform detection removed) If you need server-side preview logic, implement explicit rules

// Upload or set custom icon URL for a link (private)
router.post("/:id/set-icon", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { iconUrl } = req.body;

    // Validate link ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid link ID format" });
    }

    if (!iconUrl) {
      return res.status(400).json({ message: "iconUrl is required" });
    }

    // Validate that the URL points to a valid image
    const isValid = await isValidImageUrl(iconUrl);
    if (!isValid) {
      return res.status(400).json({
        message:
          "Invalid image URL. Please make sure you:\n" +
          "1. Use a direct image URL (e.g., .jpg, .png, .gif, .webp)\n" +
          "2. Not a webpage URL (e.g., pngtree.com/freepng/...)\n" +
          "3. Try using the auto-fetch feature first, or find the direct image link",
      });
    }

    const link = await Link.findOne({
      _id: id,
      userId: req.user.id,
    });
    if (!link)
      return res.status(404).json({ message: "Not found or not authorized" });

    link.iconUrl = iconUrl;
    await link.save();
    res.json({ success: true, iconUrl: link.iconUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Clear icon for a link (private)
router.delete("/:id/icon", auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate link ID format (MongoDB ObjectId)
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid link ID format" });
    }

    const link = await Link.findOne({
      _id: id,
      userId: req.user.id,
    });
    if (!link)
      return res.status(404).json({ message: "Not found or not authorized" });

    link.iconUrl = undefined;
    await link.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
