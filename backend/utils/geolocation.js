const crypto = require('crypto');

/**
 * Get geolocation data from IP address
 * This is a placeholder - in production, use a service like:
 * - ipapi.co (free tier: 1000 req/day)
 * - ip-api.com (free tier: 45 req/min)
 * - MaxMind GeoIP2 (self-hosted database)
 * 
 * Example with ip-api.com:
 * const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city`);
 * const data = await response.json();
 * return { country: data.countryCode, city: data.city };
 */
async function getLocationFromIP(ip) {
  try {
    // Remove this in production and use a real geolocation service
    // For development, return null to avoid external API calls
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
      return { country: null, city: null };
    }
    
    // Uncomment and configure for production:
    /*
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city`);
    if (!response.ok) return { country: null, city: null };
    
    const data = await response.json();
    return {
      country: data.countryCode || null,
      city: data.city || null
    };
    */
    
    return { country: null, city: null };
  } catch (error) {
    console.error('Geolocation error:', error);
    return { country: null, city: null };
  }
}

/**
 * Hash IP address for privacy-preserving analytics
 * Uses SHA-256 hash so we can count unique visitors without storing IPs
 */
function hashIP(ip) {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex');
}

/**
 * Extract referrer domain from full URL
 * e.g., "https://www.google.com/search?q=test" -> "google.com"
 */
function extractReferrerDomain(referrerUrl) {
  if (!referrerUrl || referrerUrl === 'direct') return 'direct';
  
  try {
    const url = new URL(referrerUrl);
    let hostname = url.hostname;
    
    // Remove 'www.' prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch (error) {
    return 'direct';
  }
}

/**
 * Get client IP from request
 * Handles proxies and load balancers
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list
    return forwarded.split(',')[0].trim();
  }
  
  return req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         req.ip;
}

module.exports = {
  getLocationFromIP,
  hashIP,
  extractReferrerDomain,
  getClientIP
};
