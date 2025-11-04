// CHANGE: serverless proxy for Football-Data.org for Vercel deployment.
// Save this file as /api/football.js (Node.js serverless).
// It expects FOOTBALL_API_KEY to be set in environment variables in Vercel.
const fetch = require('node-fetch');

// Simple in-memory cache (per serverless container lifetime)
const cache = new Map();

function cacheGet(key) {
  const v = cache.get(key);
  if (!v) return null;
  if (Date.now() > v.exp) {
    cache.delete(key);
    return null;
  }
  return v.val;
}

function cacheSet(key, val, ttlSec) {
  cache.set(key, { val: val, exp: Date.now() + ttlSec*1000 });
}

module.exports = async (req, res) => {
  // Allow CORS for static site
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','*');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const path = req.query.path || req.url.split('?path=')[1] || '';
  if (!path) {
    res.status(400).json({ error: 'Missing path param. Example: /api/football?path=/v4/competitions/PL/matches' });
    return;
  }

  // Basic path sanitization - only allow /v4/ endpoints
  if (!path.startsWith('/v4/')) {
    res.status(400).json({ error: 'Only /v4/ endpoints are allowed' });
    return;
  }

  // Decide TTL based on endpoint (live short, schedule longer)
  let ttl = 60; // default 60s
  if (path.includes('/matches') && path.includes('status=LIVE')) ttl = 30;
  if (path.includes('/standings')) ttl = 300;
  if (path.includes('/matches') && !path.includes('status=LIVE')) ttl = 300;

  const cacheKey = path;
  const cached = cacheGet(cacheKey);
  if (cached) {
    res.status(200).json(cached);
    return;
  }

  const API_KEY = process.env.FOOTBALL_API_KEY;
  if (!API_KEY) {
    res.status(500).json({ error: 'Server incomplete: FOOTBALL_API_KEY not set in environment variables' });
    return;
  }

  try {
    const apiRes = await fetch('https://api.football-data.org' + path, {
      headers: { 'X-Auth-Token': API_KEY, 'User-Agent': 'BlogFootball-Proxy/1.0' },
      timeout: 10000
    });

    if (apiRes.status === 429) {
      res.setHeader('Retry-After', apiRes.headers.get('Retry-After') || '60');
      res.status(429).json({ error: 'Upstream rate limited' });
      return;
    }

    const data = await apiRes.json();
    cacheSet(cacheKey, data, ttl);
    res.status(apiRes.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'Upstream fetch failed', details: err.message });
  }
};
