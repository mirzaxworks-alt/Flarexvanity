# 🌐 Flarex™ Dashboard - Cloudflare Pages Edition

Production-ready Discord Bot Web Dashboard styled with the signature **Dark Espresso Brown Theme** and built for high-performance hosting on **Cloudflare Pages**.

## 🚀 Quick Start for Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Upload assets**.
2. Upload this folder (or `flarex_dashboard_deploy.zip`).
3. Add Environment Variable:
   - `BOT_API_URL`: URL of your backend REST API (e.g. `http://YOUR_VPS_IP:8080` or `https://api.yourdomain.com`).
4. Set up your custom domain under **Custom domains**.

## 📁 Key Files & Structure
- `index.html`: Complete SPA dashboard with all moderation, leveling, antinuke, and free trial modules.
- `css/style.css`: Dark espresso palette, custom glassmorphism, responsive styles.
- `js/app.js`: Live Discord OAuth, server sync, trial claim logic, and settings controllers.
- `functions/api/[[path]].js`: Native Cloudflare Pages Serverless Edge proxy for all `/api/*` requests.
- `_headers`: Explicit Content-Type headers, cache rules, and CORS.
- `_redirects`: SPA route fallback for single-page application routing.
- `_routes.json`: Routing rules optimizing static asset delivery from Cloudflare's global edge cache.
- `wrangler.toml`: Cloudflare Wrangler CLI configuration.

For full instructions, see **`CLOUDFLARE_DEPLOY_GUIDE.md`**.
