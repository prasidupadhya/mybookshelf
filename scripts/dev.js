import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadLocalEnv } from '../lib/env.js';
import { ADMIN_SLUG } from '../config/admin.js';
import { SECURITY_HEADERS } from '../config/security.js';

loadLocalEnv();
const root = resolve('public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.txt': 'text/plain' };
const routes = {
  '/api/books': 'api/books.js', '/api/admin/login': 'api/admin/login.js',
  '/api/admin/logout': 'api/admin/logout.js', '/api/admin/me': 'api/admin/me.js',
  '/api/admin/cover': 'api/admin/cover.js',
  '/api/admin/books': 'api/admin/books/index.js', '/api/admin/books/reorder': 'api/admin/books/reorder.js'
};
const server = createServer(async (req, res) => {
  for (const { key, value } of SECURITY_HEADERS) res.setHeader(key, value);
  const url = new URL(req.url, 'http://localhost');
  let path;
  try { path = decodeURIComponent(url.pathname); }
  catch { res.writeHead(400); return res.end('Invalid URL'); }
  const dynamic = /^\/api\/admin\/books\/([^/]+)$/.exec(path);
  const cover = /^\/api\/books\/([^/]+)\/cover$/.exec(path);
  const apiFile = routes[path] || (dynamic ? 'api/admin/books/[id].js' : cover ? 'api/books/[id]/cover.js' : null);
  if (apiFile) {
    req.query = Object.fromEntries(url.searchParams); if (dynamic) req.query.id = dynamic[1];
    if (cover) req.query.id = cover[1];
    const { default: handler } = await import(pathToFileURL(resolve(apiFile)));
    return handler(req, res);
  }
  if (path.startsWith('/api/')) { res.writeHead(404); return res.end('Not found'); }
  const target = path === `/${ADMIN_SLUG}` || path === `/${ADMIN_SLUG}/` ? '/admin/index.html' : path.endsWith('/') ? path + 'index.html' : path;
  const file = resolve(root, '.' + target);
  if (!file.startsWith(root + '/')) { res.writeHead(404); return res.end('Not found'); }
  try {
    const content = await readFile(file);
    if (target.startsWith('/admin/')) { res.setHeader('X-Robots-Tag', 'noindex, nofollow'); res.setHeader('Cache-Control', 'no-store'); }
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(Number(process.env.PORT) || 3000, '127.0.0.1', () => console.log(`Bookshelf available at http://localhost:${server.address().port}`));
