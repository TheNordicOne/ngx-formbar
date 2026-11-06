import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import process from 'node:process';
import { setInterval, setTimeout } from 'node:timers';
import { URL } from 'node:url';

const [root, port] = process.argv.slice(2);
const CONTENT_TYPES = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.map': 'application/json',
  '.mjs': 'text/javascript',
  '.svg': 'image/svg+xml',
};

/** Serves a build under `/m/id-<mutant>/`, with that mutant active in the stories. */
const server = createServer(async (request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const [, id = '', path = '/index.html'] =
    /^\/m\/id-([^/]*)(\/.*)?$/.exec(pathname) ?? [];

  try {
    const file = await readFile(join(root, normalize(path)));

    response.writeHead(200, {
      'content-type':
        CONTENT_TYPES[extname(path)] ?? 'application/octet-stream',
    });
    response.end(
      path.endsWith('iframe.html')
        ? String(file).replace(
            '<head>',
            `<head><script>globalThis.__stryker__ = { activeMutant: ${JSON.stringify(id)} };</script>`,
          )
        : file,
    );
  } catch {
    response.writeHead(404);
    response.end();
  }
});

// A leftover server of an earlier run gives up the port once its sandbox is gone.
server.on('error', () => setTimeout(() => server.listen(Number(port)), 500));
server.listen(Number(port), '127.0.0.1');

setInterval(() => {
  if (!existsSync(root)) {
    process.exit();
  }
}, 1000);
