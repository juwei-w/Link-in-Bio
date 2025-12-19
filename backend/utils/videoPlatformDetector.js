/**
 * Detect video platform from URL and return platform info with icon
 */

const PLATFORMS = {
  youtube: {
    name: "YouTube",
    patterns: [/(?:youtube\.com|youtu\.be)/i],
    icon: "https://www.youtube.com/favicon.ico",
    color: "#FF0000",
  },
  vimeo: {
    name: "Vimeo",
    patterns: [/vimeo\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=vimeo.com&sz=128",
    color: "#1AB7EA",
  },
  tiktok: {
    name: "TikTok",
    patterns: [/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=tiktok.com&sz=128",
    color: "#000000",
  },
  twitch: {
    name: "Twitch",
    patterns: [/twitch\.tv/i],
    icon: "https://www.google.com/s2/favicons?domain=twitch.tv&sz=128",
    color: "#9146FF",
  },
  instagram: {
    name: "Instagram",
    patterns: [/instagram\.com|instagr\.am/i],
    icon: "https://www.google.com/s2/favicons?domain=instagram.com&sz=128",
    color: "#E4405F",
  },
  twitter: {
    name: "Twitter / X",
    patterns: [/twitter\.com|x\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=twitter.com&sz=128",
    color: "#000000",
  },
  facebook: {
    name: "Facebook",
    patterns: [/facebook\.com|fb\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=facebook.com&sz=128",
    color: "#1877F2",
  },
  twitch_clip: {
    name: "Twitch Clips",
    patterns: [/clips\.twitch\.tv/i],
    icon: "https://www.google.com/s2/favicons?domain=twitch.tv&sz=128",
    color: "#9146FF",
  },
  dailymotion: {
    name: "Dailymotion",
    patterns: [/dailymotion\.com|dai\.ly/i],
    icon: "https://www.google.com/s2/favicons?domain=dailymotion.com&sz=128",
    color: "#0066FF",
  },
  rumble: {
    name: "Rumble",
    patterns: [/rumble\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=rumble.com&sz=128",
    color: "#1FB100",
  },
  twitch_vod: {
    name: "Twitch VOD",
    patterns: [/twitch\.tv\/videos/i],
    icon: "https://www.google.com/s2/favicons?domain=twitch.tv&sz=128",
    color: "#9146FF",
  },
  linkedin: {
    name: "LinkedIn",
    patterns: [/linkedin\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=linkedin.com&sz=128",
    color: "#0A66C2",
  },
  spotify: {
    name: "Spotify",
    patterns: [/spotify\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=spotify.com&sz=128",
    color: "#1DB954",
  },
  soundcloud: {
    name: "SoundCloud",
    patterns: [/soundcloud\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=soundcloud.com&sz=128",
    color: "#FF7700",
  },
  github: {
    name: "GitHub",
    patterns: [/github\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=github.com&sz=128",
    color: "#181717",
  },
  reddit: {
    name: "Reddit",
    patterns: [/reddit\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=reddit.com&sz=128",
    color: "#FF4500",
  },
  discord: {
    name: "Discord",
    patterns: [/discord\.com|discord\.gg/i],
    icon: "https://www.google.com/s2/favicons?domain=discord.com&sz=128",
    color: "#5865F2",
  },
  amazon: {
    name: "Amazon",
    patterns: [/amazon\.com|amzn\.to/i],
    icon: "https://www.google.com/s2/favicons?domain=amazon.com&sz=128",
    color: "#FF9900",
  },
  etsy: {
    name: "Etsy",
    patterns: [/etsy\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=etsy.com&sz=128",
    color: "#F1641E",
  },
  patreon: {
    name: "Patreon",
    patterns: [/patreon\.com/i],
    icon: "https://www.google.com/s2/favicons?domain=patreon.com&sz=128",
    color: "#FF424D",
  },
};

/**
 * Detect video/content platform from URL
 * @param {string} url - The URL to detect
 * @returns {Object|null} - Platform info with name, icon, and color, or null if not detected
 */
function detectPlatform(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const fullUrl = urlObj.toString();
    const hostname = urlObj.hostname.toLowerCase();

    // Debug: log incoming URL for detection
    console.debug(
      "[videoPlatformDetector] detectPlatform called for URL:",
      fullUrl
    );

    // Handle localhost - return null to let user use auto-fetch or custom icon
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.")
    ) {
      console.debug(
        "[videoPlatformDetector] local URL detected, skipping platform detection for:",
        hostname
      );
      return null; // Local URLs don't need platform detection
    }

    // Check each platform's patterns
    for (const [key, platform] of Object.entries(PLATFORMS)) {
      for (const pattern of platform.patterns) {
        try {
          if (pattern.test(fullUrl)) {
            console.debug(
              `[videoPlatformDetector] matched platform=${key} using pattern=${pattern}`
            );
            return {
              platformId: key,
              name: platform.name,
              icon: platform.icon,
              color: platform.color,
              url: url,
            };
          }
        } catch (re) {
          // in case pattern.test throws for malformed regex or input
          console.warn("[videoPlatformDetector] pattern test error", {
            key,
            pattern: String(pattern),
            err: re.message,
          });
        }
      }
    }

    console.debug(
      "[videoPlatformDetector] no platform matched for URL:",
      fullUrl
    );

    // If no platform matched, return null
    return null;
  } catch (err) {
    console.error("Error detecting platform:", err.message);
    return null;
  }
}

/**
 * Get all available platforms
 */
function getAllPlatforms() {
  return Object.entries(PLATFORMS).map(([key, platform]) => ({
    platformId: key,
    name: platform.name,
    icon: platform.icon,
    color: platform.color,
  }));
}

module.exports = {
  detectPlatform,
  getAllPlatforms,
  PLATFORMS,
};
