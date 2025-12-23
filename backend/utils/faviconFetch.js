const axios = require("axios");

/**
 * Fetch favicon/icon for a given URL using multiple services
 * Fallback chain: Google Favicon API -> DuckDuckGo -> Clearbit Logo API
 */
async function fetchFavicon(url) {
  try {
    // Parse the URL to get the domain
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace("www.", "");

    // Try multiple favicon services in order

    // 1. Try Google Favicon API (reliable and fast)
    try {
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      return googleFaviconUrl; // Google always returns a response, even if it's a default icon
    } catch (err) {
      // Continue to next service
    }

    // 2. Try DuckDuckGo Favicon API
    try {
      const ddgFaviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      const response = await axios.head(ddgFaviconUrl, { timeout: 5000 });
      if (response.status === 200) {
        return ddgFaviconUrl;
      }
    } catch (err) {
      // Continue to next service
    }

    // 3. Try Clearbit Logo API (higher quality logos)
    try {
      const clearbitUrl = `https://logo.clearbit.com/${domain}?size=200`;
      const response = await axios.head(clearbitUrl, { timeout: 5000 });
      if (response.status === 200) {
        return clearbitUrl;
      }
    } catch (err) {
      // Continue to next service
    }

    // 4. Fallback to constructed favicon.ico path
    try {
      const directFaviconUrl = `https://${domain}/favicon.ico`;
      const response = await axios.head(directFaviconUrl, { timeout: 5000 });
      if (response.status === 200) {
        return directFaviconUrl;
      }
    } catch (err) {
      // Continue to fallback
    }

    // Always return Google's favicon as final fallback (it never fails)
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch (err) {
    console.error("Error fetching favicon:", err.message);
    return null;
  }
}

/**
 * Validate if a URL is a valid image
 * More lenient: accepts image URLs and tries to validate by checking content-type or file extension
 */
async function isValidImageUrl(imageUrl) {
  try {
    // Check if URL has common image extensions
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".ico",
      ".bmp",
    ];
    const lowerUrl = imageUrl.toLowerCase();

    // Common CDN and image hosting services (assume they're valid)
    const trustedDomains = [
      "cdn",
      "cloudinary",
      "imgix",
      "imagekit",
      "cloudflare",
      "fastly",
      "imgur",
      "giphy",
      "tenor",
      "media.giphy",
      "api.giphy",
      "storage.googleapis",
      "firebasestorage",
      "google.com/s2/favicons",
      "icons.duckduckgo.com",
      "logo.clearbit.com",
    ];

    // Check if URL is from a trusted image service
    if (trustedDomains.some((domain) => lowerUrl.includes(domain))) {
      // Likely a valid image URL from a trusted service
      return true;
    }

    if (imageExtensions.some((ext) => lowerUrl.includes(ext))) {
      // URL has image extension, validate more thoroughly
      try {
        const response = await axios.head(imageUrl, {
          timeout: 5000,
          followRedirects: true,
          maxRedirects: 5,
        });
        const contentType = response.headers["content-type"] || "";
        // Accept if content-type is image or if we got a successful response
        return contentType.startsWith("image/") || response.status === 200;
      } catch (err) {
        // HEAD failed, try GET with stream (don't download full content)
        try {
          const response = await axios.get(imageUrl, {
            timeout: 5000,
            maxRedirects: 5,
            maxContentLength: 1024 * 1024, // 1MB limit for checking
          });
          const contentType = response.headers["content-type"] || "";
          return contentType.startsWith("image/") || response.status === 200;
        } catch (err2) {
          // If it has image extension but validation failed, still accept it
          // (might be a valid image with headers issues)
          return true;
        }
      }
    }

    // If no image extension, try to fetch and check content-type
    try {
      const response = await axios.head(imageUrl, {
        timeout: 5000,
        followRedirects: true,
        maxRedirects: 5,
      });
      const contentType = response.headers["content-type"] || "";
      return contentType.startsWith("image/");
    } catch (err) {
      // HEAD request failed, try GET
      try {
        const response = await axios.get(imageUrl, {
          timeout: 5000,
          maxRedirects: 5,
          maxContentLength: 1024 * 1024, // 1MB limit
        });
        const contentType = response.headers["content-type"] || "";
        return contentType.startsWith("image/");
      } catch (err2) {
        // URL doesn't appear to be an image
        return false;
      }
    }
  } catch (err) {
    console.error("Error validating image URL:", err.message);
    // If validation throws error, reject it
    return false;
  }
}

module.exports = {
  fetchFavicon,
  isValidImageUrl,
};
