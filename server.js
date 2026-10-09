const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || process.env.DASHBOARD_PORT || 3000;
const BOT_API_URL = (process.env.BOT_API_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const BOT_API_SECRET = process.env.BOT_API_SECRET || '';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Bot-Secret, Cookie');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Forward /api/* requests to backend REST API
  if (pathname.startsWith('/api/')) {
    const targetUrl = `${BOT_API_URL}${pathname}${parsedUrl.search || ''}`;
    const targetParsed = url.parse(targetUrl);

    let body = [];
    req.on('data', chunk => body.push(chunk));
    req.on('end', () => {
      body = Buffer.concat(body);

      const headers = { ...req.headers, host: targetParsed.host };
      if (BOT_API_SECRET) headers['x-bot-secret'] = BOT_API_SECRET;

      const proxyReq = http.request(
        {
          hostname: targetParsed.hostname,
          port: targetParsed.port || 80,
          path: targetParsed.path,
          method: req.method,
          headers
        },
        proxyRes => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );

      proxyReq.on('error', err => {
        console.error(`[Proxy Error] ${err.message}`);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Backend unreachable', details: err.message }));
      });

      if (body.length > 0) {
        proxyReq.write(body);
      }
      proxyReq.end();
    });
    return;
  }

  // Serve static files (SPA fallback to index.html)
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  let filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for SPA routing to index.html
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('500 Internal Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log('====================================================');
  console.log(` ★ Flarex Web Dashboard Production Server Online`);
  console.log(` ★ Listening at: http://localhost:${PORT}`);
  console.log(` ★ API Proxy Target: ${BOT_API_URL}`);
  console.log('====================================================');
});
