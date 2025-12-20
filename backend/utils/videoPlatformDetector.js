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

// Platform auto-detection removed; keep platforms list and helper

// Note: platform auto-detection removed in favor of explicit icon upload
function getAllPlatforms() {
  return Object.entries(PLATFORMS).map(([key, platform]) => ({
    platformId: key,
    name: platform.name,
    icon: platform.icon,
    color: platform.color,
  }));
}

module.exports = {
  getAllPlatforms,
  PLATFORMS,
};
