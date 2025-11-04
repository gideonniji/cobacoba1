BlogFootball - Optimized

This fork has been automatically optimized for security, performance, SEO and accessibility.

Important:
- The serverless proxy /api/football.js expects an environment variable: FOOTBALL_API_KEY
  Set it in Vercel Dashboard > Project > Settings > Environment Variables.
- To deploy to Vercel, upload this folder as a new project or connect your GitHub repo.

What's changed:
- Removed API key from frontend. Added /api/football.js (serverless) with caching.
- Client-side caching and fallback handling added to script.js.
- Lazy-loading images, skip link, OG meta, sitemap.xml, robots.txt, vercel.json.

