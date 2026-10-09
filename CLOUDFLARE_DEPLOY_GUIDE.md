# ☁️ Flarex™ Dashboard - Cloudflare Pages Deployment Guide

This folder is configured specifically for **Cloudflare Pages**, with native Edge Functions, proper MIME type headers, SPA fallback routing, and zero Vercel dependencies.

---

## 📁 What is in this folder:
- **`index.html`**: The full Flarex Dashboard Single Page Application (SPA) with Dark Espresso Theme.
- **`css/style.css`**: Complete luxury glassmorphism stylesheets with balanced syntax and responsive layouts.
- **`js/app.js`**: Interactive client application, Discord OAuth authentication, live account & server sync, and trial claiming.
- **`functions/api/[[path]].js`**: Native **Cloudflare Pages Serverless Edge Function** for proxying all `/api/*` requests to your Discord bot backend.
- **`_headers`**: Declares explicit `Content-Type: text/css` and `application/javascript`, plus CORS and security headers.
- **`_redirects`**: Enables SPA fallback (`/* /index.html 200`) so refreshing any page or direct URL never breaks.
- **`_routes.json`**: Prevents Cloudflare Workers from intercepting static CSS/JS/images, serving them instantly from Cloudflare's global edge cache.
- **`wrangler.toml`**: Cloudflare CLI / Wrangler deployment manifest.
- **`assets/`**: All brand logos, crowns, avatars, icons, and tier posters (`gold_poster.png`, `obsidian_poster.jpg`, `diamond_poster.jpg`, `premium_tiers_poster.jpg`).
- **`data/guild_configs.json`**: Default server configuration definitions.

---

## 🚀 Step-by-Step Deployment Options on Cloudflare

### Option A: Direct Drag-and-Drop Upload (Easiest - 1 Minute)
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Navigate to **Workers & Pages** -> **Create application** -> **Pages** tab.
3. Select **Upload assets**.
4. Enter a Project name (e.g. `flarex-dashboard`).
5. Drag and drop the **`flarex_dashboard_upload_to_domain`** folder (or upload `flarex_dashboard_deploy.zip`).
6. Click **Deploy site**.
7. Go to **Settings** -> **Environment variables** (under *Production*):
   - Add variable: `BOT_API_URL` -> URL of your backend (e.g. `http://YOUR_VPS_IP:8080` or `https://api.yourdomain.com`).
   - *(Optional)* `BOT_API_SECRET` -> Matching your `.env` secret if set.
8. Go to **Custom domains** tab -> Click **Set up a custom domain** -> Enter your domain (e.g., `dashboard.yourdomain.com` or `yourdomain.com`).

---

### Option B: Cloudflare Pages with Git / GitHub
1. Push this folder to a GitHub/GitLab repository.
2. In Cloudflare Dashboard, go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your repository.
4. Set the build settings:
   - **Framework preset**: `None`
   - **Build command**: *(leave empty)*
   - **Build output directory**: `.` *(or root)*
5. In **Environment variables**, add:
   - `BOT_API_URL` = `http://YOUR_VPS_IP:8080`
6. Click **Save and Deploy**.

---

### Option C: Cloudflare Wrangler CLI (Command Line)
If you have `wrangler` installed:
```bash
# Preview locally with Cloudflare Pages Functions
npx wrangler pages dev .

# Deploy directly to Cloudflare
npx wrangler pages deploy . --project-name flarex-dashboard
```

---

## 🔒 Discord Developer Portal OAuth2 Setup

To allow users to log in with Discord on your Cloudflare domain:
1. Open [Discord Developer Portal](https://discord.com/developers/applications).
2. Select your Application -> **OAuth2** -> **Redirects**.
3. Add your domain's callback URL:
   - `https://yourdomain.com/`
   - `https://yourdomain.com/api/auth/discord/callback`
   - `https://your-project.pages.dev/api/auth/discord/callback`
4. In your backend server's `.env`, configure:
   ```env
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_CLIENT_SECRET=your_client_secret
   DISCORD_REDIRECT_URI=https://yourdomain.com/api/auth/discord/callback
   ```

---

## ✅ Verified Features on Cloudflare Edge:
- 🎨 **Dark Espresso Theme**: Guaranteed styling with inline fallback tokens and CSS syntax balancing.
- 🔤 **Typography**: Cinzel, Inter, Plus Jakarta Sans, and JetBrains Mono fonts.
- ⚡ **SPA Navigation**: Seamless tab switching and deep links with `_redirects` support.
- 🛡️ **Edge Function API Bridge**: Native `functions/api/[[path]].js` handling all REST requests.
- 🏅 **7-Day Gold Free Trial**: Claim trial directly from the dashboard with instant server synchronization.
- 🛡️ **AutoMod, AntiNuke, Welcomer, Tickets, Leveling**: All management modules fully operational.
