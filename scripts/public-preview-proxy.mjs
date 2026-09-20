import http from 'node:http';

const PORT = Number(process.env.PREVIEW_PROXY_PORT ?? 8787);
const WEB_PORT = Number(process.env.WEB_PORT ?? 3002);
const API_PORT = Number(process.env.API_PORT ?? 3001);

function proxy(req, res, port) {
  const headers = { ...req.headers, host: `127.0.0.1:${port}` };
  const upstream = http.request(
    {
      hostname: '127.0.0.1',
      port,
      path: req.url,
      method: req.method,
      headers,
      timeout: 10 * 60 * 1000,
    },
    (incoming) => {
      res.writeHead(incoming.statusCode ?? 502, incoming.headers);
      incoming.pipe(res);
    },
  );
  upstream.on('error', (error) => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Bad gateway (${port}): ${error.message}`);
  });
  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';
  if (url.startsWith('/api/') || url.startsWith('/media/')) {
    proxy(req, res, API_PORT);
    return;
  }
  proxy(req, res, WEB_PORT);
});

server.timeout = 0;
server.headersTimeout = 0;
server.requestTimeout = 0;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`preview proxy http://127.0.0.1:${PORT} → web :${WEB_PORT}, api :${API_PORT}`);
});
