// Serves the production build of the client for the end-to-end tests, the way a host
// would: static files with index.html for app routes, and /api plus the calls socket
// forwarded to the API. Much lighter than `ng serve`, and it tests what gets deployed.
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import httpProxy from 'http-proxy';

const clientDir = fileURLToPath(new URL('../../client/', import.meta.url));
const root = join(clientDir, 'dist', 'client', 'browser');
const port = Number(process.env.WEB_PORT ?? 4399);
const api = process.env.API_URL ?? 'http://localhost:3399';

const build = spawnSync('npm', ['run', 'build'], { cwd: clientDir, stdio: 'inherit', shell: true });
if (build.status !== 0) process.exit(build.status ?? 1);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

const proxy = httpProxy.createProxyServer({ target: api, changeOrigin: true, ws: true });
proxy.on('error', (_error, _req, res) => {
  if (res && 'writeHead' in res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('API unavailable');
  }
});

const isApi = (url = '') => url.startsWith('/api/') || url.startsWith('/socket.io/');

const server = createServer((req, res) => {
  if (isApi(req.url)) return proxy.web(req, res);

  const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const file = normalize(join(root, path));
  const servable = file.startsWith(root) && existsSync(file) && statSync(file).isFile();
  // App routes (e.g. /contacts/123) get index.html, as on a static host with SPA rewrites.
  const target = servable ? file : join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream' });
  createReadStream(target).pipe(res);
});

server.on('upgrade', (req, socket, head) => {
  if (isApi(req.url)) proxy.ws(req, socket, head);
  else socket.destroy();
});

server.listen(port, () => console.log(`Client (production build) on http://localhost:${port}, API ${api}`));
