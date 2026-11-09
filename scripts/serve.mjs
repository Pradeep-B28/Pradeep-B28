import http from 'http';
import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(import.meta.dirname, '..');
const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.xml': 'application/xml'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;

  if (pathname === '/' || pathname === '/Pradeep-B28') {
    res.writeHead(302, { Location: '/Pradeep-B28/' });
    res.end();
    return;
  }

  if (!pathname.startsWith('/Pradeep-B28/')) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  let relativePath = pathname.replace('/Pradeep-B28/', '');
  if (!relativePath || relativePath === '') {
    relativePath = 'index.html';
  }

  const filePath = path.join(rootDir, relativePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404
      const notFoundPath = path.join(rootDir, '404.html');
      fs.readFile(notFoundPath, (err404, data404) => {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(data404 || '404 Not Found');
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}/Pradeep-B28/`);
});
