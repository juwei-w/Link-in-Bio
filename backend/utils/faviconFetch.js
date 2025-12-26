const axios = require('axios');

/**
 * Robust favicon fetcher: prefers high-quality site icons, then Clearbit, Google, DuckDuckGo, then /favicon.ico
 */
async function fetchFavicon(url) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    const origin = urlObj.origin;

    // 1) Scrape site for declared icons and og/twitter images
    try {
      const pageResp = await axios.get(url, { timeout: 6000, maxRedirects: 5 });
      const html = pageResp && pageResp.data ? String(pageResp.data) : '';
      const candidates = [];

      const resolveUrl = (u) => {
        try { return new URL(u, origin).toString(); } catch (e) { return null; }
      };

      const linkRegex = /<link[^>]+>/gi;
      let m;
      while ((m = linkRegex.exec(html))) {
        const tag = m[0];
        const relMatch = tag.match(/rel\s*=\s*"([^"]+)"/i);
        const hrefMatch = tag.match(/href\s*=\s*"([^"]+)"/i);
        const sizesMatch = tag.match(/sizes\s*=\s*"([^"]+)"/i);
        if (relMatch && hrefMatch) {
          const rel = relMatch[1].toLowerCase();
          const href = hrefMatch[1];
          if (/icon|apple-touch-icon|mask-icon/.test(rel)) {
            candidates.push({ url: resolveUrl(href), rel, sizes: sizesMatch ? sizesMatch[1] : undefined });
          }
        }
      }

      const ogMatch = html.match(/<meta[^>]+property=\"og:image\"[^>]+content=\"([^\"]+)\"/i);
      if (ogMatch && ogMatch[1]) candidates.push({ url: resolveUrl(ogMatch[1]), rel: 'og:image' });
      const twMatch = html.match(/<meta[^>]+name=\"twitter:image\"[^>]+content=\"([^\"]+)\"/i);
      if (twMatch && twMatch[1]) candidates.push({ url: resolveUrl(twMatch[1]), rel: 'twitter:image' });

      // common fallback paths
      candidates.push({ url: resolveUrl('/apple-touch-icon.png'), rel: 'common' });
      candidates.push({ url: resolveUrl('/apple-touch-icon-precomposed.png'), rel: 'common' });
      candidates.push({ url: resolveUrl('/favicon-192.png'), rel: 'common' });
      candidates.push({ url: resolveUrl('/favicon-512.png'), rel: 'common' });

      // Score candidates by likely quality
      const scored = [];
      for (const c of candidates) {
        if (!c.url) continue;
        try {
          // Prefer SVGs and mask-icons quickly
          if (/\.svg($|\?)/i.test(c.url) || c.rel === 'mask-icon') {
            scored.push({ url: c.url, score: 200 + (c.sizes ? parseInt(c.sizes, 10) || 0 : 0) });
            continue;
          }

          try {
            const h = await axios.head(c.url, { timeout: 5000, maxRedirects: 5 });
            const ct = (h.headers['content-type'] || '') + '';
            const cl = parseInt(h.headers['content-length'] || '0', 10) || 0;
            if (ct.startsWith('image/')) {
              let s = 80;
              if (/png|webp|jpeg|jpg/.test(ct)) s += 20;
              if (c.sizes) s += Math.min(parseInt((c.sizes || '').split('x')[0], 10) || 0, 512) / 4;
              s += Math.min(Math.floor(cl / 2000), 50);
              scored.push({ url: c.url, score: s });
              continue;
            }
          } catch (headErr) {
            try {
              const g = await axios.get(c.url, { timeout: 6000, responseType: 'arraybuffer', maxContentLength: 1024 * 1024 });
              const ct = (g.headers['content-type'] || '') + '';
              const len = g.data ? g.data.length : 0;
              if (ct.startsWith('image/')) {
                let s = 50;
                if (/svg/.test(ct)) s += 40;
                if (/png|webp|jpeg|jpg/.test(ct)) s += 20;
                s += Math.min(Math.floor(len / 2000), 50);
                scored.push({ url: c.url, score: s });
                continue;
              }
            } catch (getErr) {
              // ignore
            }
          }
        } catch (_) {
          // ignore candidate
        }
      }

      if (scored.length > 0) {
        scored.sort((a, b) => b.score - a.score);
        return scored[0].url;
      }
    } catch (err) {
      // scraping failed, continue to other fallbacks
    }

    // 2) Try Clearbit (logo) - often high quality
    try {
      const clearbitUrl = `https://logo.clearbit.com/${domain}?size=512`;
      const resp = await axios.head(clearbitUrl, { timeout: 5000 });
      if (resp && resp.status === 200) return clearbitUrl;
    } catch (e) {
      // ignore
    }

    // 3) Google favicon API (large sz)
    try {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=512`;
    } catch (e) {}

    // 4) DuckDuckGo
    try {
      const ddg = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      const r = await axios.head(ddg, { timeout: 5000 });
      if (r && r.status === 200) return ddg;
    } catch (e) {}

    // 5) direct /favicon.ico
    try {
      const direct = `https://${domain}/favicon.ico`;
      const r = await axios.head(direct, { timeout: 5000 });
      if (r && r.status === 200) return direct;
    } catch (e) {}

    // final fallback to Google small
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=512`;
  } catch (err) {
    console.error('Error fetching favicon:', err && err.message);
    return null;
  }
}

async function isValidImageUrl(imageUrl) {
  try {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp'];
    const lowerUrl = String(imageUrl || '').toLowerCase();

    const trustedDomains = [
      'cdn', 'cloudinary', 'imgix', 'imagekit', 'cloudflare', 'fastly', 'imgur', 'giphy', 'tenor', 'media.giphy', 'api.giphy', 'storage.googleapis', 'firebasestorage', 'google.com/s2/favicons', 'icons.duckduckgo.com', 'logo.clearbit.com'
    ];

    if (trustedDomains.some((d) => lowerUrl.includes(d))) return true;

    if (imageExtensions.some((ext) => lowerUrl.includes(ext))) {
      try {
        const response = await axios.head(imageUrl, { timeout: 5000, maxRedirects: 5 });
        const contentType = response.headers['content-type'] || '';
        return contentType.startsWith('image/') || response.status === 200;
      } catch (err) {
        try {
          const response = await axios.get(imageUrl, { timeout: 5000, maxRedirects: 5, maxContentLength: 1024 * 1024 });
          const contentType = response.headers['content-type'] || '';
          return contentType.startsWith('image/') || response.status === 200;
        } catch (err2) {
          return true;
        }
      }
    }

    try {
      const response = await axios.head(imageUrl, { timeout: 5000, maxRedirects: 5 });
      const contentType = response.headers['content-type'] || '';
      return contentType.startsWith('image/');
    } catch (err) {
      try {
        const response = await axios.get(imageUrl, { timeout: 5000, maxRedirects: 5, maxContentLength: 1024 * 1024 });
        const contentType = response.headers['content-type'] || '';
        return contentType.startsWith('image/');
      } catch (err2) {
        return false;
      }
    }
  } catch (err) {
    console.error('Error validating image URL:', err && err.message);
    return false;
  }
}

module.exports = { fetchFavicon, isValidImageUrl };
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

    // Prefer higher-quality logo providers first (Clearbit), then Google (larger size)
    // 1. Try Clearbit Logo API (often higher-res PNG/SVG)
    try {
      const clearbitUrl = `https://logo.clearbit.com/${domain}?size=512`;
      const response = await axios.head(clearbitUrl, { timeout: 5000 });
      if (response.status === 200) {
        return clearbitUrl;
      }
    } catch (err) {
      // Continue to next service
    }

    // 2. Try Google Favicon API with larger size parameter
    try {
      const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=512`;
      return googleFaviconUrl; // Google always returns a response (use larger size)
    } catch (err) {
      // Continue to next service
    }

    // 3. Try DuckDuckGo Favicon API
    try {
      const ddgFaviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      const response = await axios.head(ddgFaviconUrl, { timeout: 5000 });
      if (response.status === 200) {
        return ddgFaviconUrl;
      }
    } catch (err) {
      // Continue to next service
          const origin = urlObj.origin;
    }

          // 1. Try Clearbit Logo API (often higher-res PNG/SVG)
          try {
            const clearbitUrl = `https://logo.clearbit.com/${domain}?size=512`;
            const response = await axios.head(clearbitUrl, { timeout: 5000 });
            if (response.status === 200) {
              return clearbitUrl;
            }
          } catch (err) {
            // Continue to next service
          }

          // 2. Try to scrape the site's HTML for high-res icons (apple-touch-icon, og:image, link[rel~=icon])
          try {
            const pageResp = await axios.get(url, { timeout: 6000, maxRedirects: 5 });
            const html = (pageResp && pageResp.data) ? String(pageResp.data) : '';
            const candidates = [];

            // Helper to resolve relative URLs
            const resolveUrl = (u) => {
              try {
                return new URL(u, origin).toString();
              } catch (e) {
                return null;
              }
            };

            // Extract <link ... rel="...icon" ... sizes="..." href="...">
            const linkRegex = /<link[^>]+>/gi;
            let m;
            while ((m = linkRegex.exec(html))) {
              const tag = m[0];
              const relMatch = tag.match(/rel\s*=\s*"([^"]+)"/i);
              const hrefMatch = tag.match(/href\s*=\s*"([^"]+)"/i);
              const sizesMatch = tag.match(/sizes\s*=\s*"([^"]+)"/i);
              if (relMatch && hrefMatch) {
                const rel = relMatch[1].toLowerCase();
                const href = hrefMatch[1];
                if (/icon|apple-touch-icon|mask-icon/.test(rel)) {
                  candidates.push({ url: resolveUrl(href), rel, sizes: sizesMatch ? sizesMatch[1] : undefined });
                }
              }
            }

            // Extract meta og:image and twitter:image
            const ogMatch = html.match(/<meta[^>]+property=\"og:image\"[^>]+content=\"([^\"]+)\"/i);
            if (ogMatch && ogMatch[1]) candidates.push({ url: resolveUrl(ogMatch[1]), rel: 'og:image' });
            const twMatch = html.match(/<meta[^>]+name=\"twitter:image\"[^>]+content=\"([^\"]+)\"/i);
            if (twMatch && twMatch[1]) candidates.push({ url: resolveUrl(twMatch[1]), rel: 'twitter:image' });

            // Also try common paths
            candidates.push({ url: resolveUrl('/apple-touch-icon.png'), rel: 'common' });
            candidates.push({ url: resolveUrl('/apple-touch-icon-precomposed.png'), rel: 'common' });
            candidates.push({ url: resolveUrl('/favicon-192.png'), rel: 'common' });
            candidates.push({ url: resolveUrl('/favicon-512.png'), rel: 'common' });

            // Validate and score candidates
            const scored = [];
            for (const c of candidates) {
              if (!c.url) continue;
              try {
                // Prefer SVG without checking content-length first
                if (/\.svg($|\?)/i.test(c.url) || c.rel === 'mask-icon') {
                  scored.push({ url: c.url, score: 100 + (c.sizes ? parseInt(c.sizes, 10) || 0 : 0) });
                  continue;
                }

                // HEAD request to check content-type & size
                try {
                  const h = await axios.head(c.url, { timeout: 5000, maxRedirects: 5 });
                  const ct = (h.headers['content-type'] || '') + '';
                  const cl = parseInt(h.headers['content-length'] || '0', 10) || 0;
                  if (ct.startsWith('image/')) {
                    // score heuristics: prefer png/webp/jpg and larger content-length
                    let s = 50;
                    if (/png|webp|jpeg|jpg/.test(ct)) s += 20;
                    if (c.sizes) {
                      const sizeNum = parseInt((c.sizes || '').split('x')[0], 10) || 0;
                      s += Math.min(sizeNum, 256) / 2;
                    }
                    s += Math.min(Math.floor(cl / 2000), 50);
                    scored.push({ url: c.url, score: s });
                    continue;
                  }
                } catch (headErr) {
                  // HEAD failed; try GET lightweight to validate
                  try {
                    const g = await axios.get(c.url, { timeout: 6000, responseType: 'arraybuffer', maxContentLength: 1024 * 1024 });
                    const ct = (g.headers['content-type'] || '') + '';
                    const len = g.data ? g.data.length : 0;
                    if (ct.startsWith('image/')) {
                      let s = 40;
                      if (/svg/.test(ct)) s += 40;
                      if (/png|webp|jpeg|jpg/.test(ct)) s += 20;
                      s += Math.min(Math.floor(len / 2000), 50);
                      scored.push({ url: c.url, score: s });
                      continue;
                    }
                  } catch (getErr) {
                    // ignore
                  }
                }
              } catch (errCandidate) {
                // ignore this candidate
              }
            }

            // Choose best candidate if any
            if (scored.length > 0) {
              scored.sort((a, b) => b.score - a.score);
              return scored[0].url;
            }
          } catch (err) {
            // ignore page scraping errors and continue to other fallbacks
          }

          // 3. Try Google Favicon API with larger size parameter (as fallback)
          try {
            const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=512`;
            return googleFaviconUrl; // Google always returns a response (use larger size)
          } catch (err) {
            // Continue to next service
          }

          // 4. Try DuckDuckGo Favicon API
          try {
            const ddgFaviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
            const response = await axios.head(ddgFaviconUrl, { timeout: 5000 });
            if (response.status === 200) {
              return ddgFaviconUrl;
            }
          } catch (err) {
            // Continue to next service
          }

          // 5. Fallback to constructed favicon.ico path
          try {
            const directFaviconUrl = `https://${domain}/favicon.ico`;
            const response = await axios.head(directFaviconUrl, { timeout: 5000 });
            if (response.status === 200) {
              return directFaviconUrl;
            }
          } catch (err) {
            // Continue to fallback
          }

          // Final fallback: Google with larger size
          return `https://www.google.com/s2/favicons?domain=${domain}&sz=512`;
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
