import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist');
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
http.createServer(async (req,res) => {
  const file = resolve(root, '.' + new URL(req.url, 'http://red-falcon.localhost').pathname.replace(/\/$/, '/index.html'));
  if (!file.startsWith(root + '/')) { res.writeHead(403).end(); return; }
  try { const data = await readFile(file); res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'}).end(data); }
  catch { res.writeHead(404).end('Not found'); }
}).listen(4177, '0.0.0.0', () => console.log('Red Falcon ready at http://red-falcon.localhost:4177'));
