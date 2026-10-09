/**
 * Flarex™ Cloudflare Pages Serverless Edge API Function
 * Seamlessly proxies all /api/* requests to your Discord bot backend (VPS / Cloud).
 * 
 * Cloudflare Pages Environment Variables:
 * - BOT_API_URL: Target URL of your backend (e.g. http://YOUR_VPS_IP:8080 or https://api.yourdomain.com)
 * - BOT_API_SECRET: Optional secret key matching DASHBOARD_API_SECRET in your bot backend
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Dynamic CORS origin header
  const origin = request.headers.get('Origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bot-Secret, X-Requested-With, Cookie, Set-Cookie',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const botApiUrl = (env.BOT_API_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
  const targetUrl = `${botApiUrl}${url.pathname}${url.search}`;

  // Forward incoming headers
  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set('User-Agent', 'Flarex-Cloudflare-Bridge/2.0');

  if (env.BOT_API_SECRET) {
    forwardHeaders.set('X-Bot-Secret', env.BOT_API_SECRET);
  }

  // Forward visitor IP
  const cfConnectingIp = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIp) {
    forwardHeaders.set('X-Forwarded-For', cfConnectingIp);
  }

  try {
    const fetchOptions = {
      method: request.method,
      headers: forwardHeaders,
      redirect: 'manual'
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      fetchOptions.body = request.body;
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Merge response headers with CORS headers
    const responseHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      responseHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ 
        error: 'Backend unreachable', 
        message: err.message,
        hint: 'Verify that BOT_API_URL in Cloudflare Pages Environment Variables is pointing to your online bot host.'
      }),
      { 
        status: 502, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
}
