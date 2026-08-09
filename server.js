// Zero-dependency local dev server: static files + the note API.
//
//   node server.js   →  http://localhost:3000
//
// In production the same routes are served by the Vercel functions in api/;
// both call the shared logic in lib/notes.js. All configuration is optional
// (see README.md): PORT, RESEND_API_KEY, MAIL_FROM, KV_REST_API_URL,
// KV_REST_API_TOKEN. A .env file next to this file is loaded at boot.

import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createNote, readNote, answerNote, NoteError } from './lib/notes.js';
import { backend } from './lib/store.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  let text;
  try {
    text = readFileSync(path.join(ROOT, '.env'), 'utf8');
  } catch {
    return; // no .env file — fine, everything has a fallback
  }

  for (const line of text.split(/\r?\n/)) {
    if (line.trim().startsWith('#')) continue;
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (!(key in process.env)) process.env[key] = raw.replace(/^(["'])(.*)\1$/, '$2');
  }
}

loadDotEnv();
const PORT = Number(process.env.PORT) || 3000;

// --- static files ----------------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// Server-side code and config never leave the building.
const PRIVATE = ['server.js', 'package.json', 'api', 'lib', 'test'];

async function serveStatic(res, urlPath) {
  const relative = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath.slice(1));
  const filePath = path.normalize(path.join(ROOT, relative));

  const inRoot = filePath.startsWith(ROOT + path.sep);
  const isPrivate = PRIVATE.some((p) => filePath === path.join(ROOT, p) || filePath.startsWith(path.join(ROOT, p) + path.sep));
  const type = MIME[path.extname(filePath).toLowerCase()];
  if (!inRoot || isPrivate || !type) return sendJson(res, 404, { error: 'not found' });

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: 'not found' });
  }
}

// --- helpers ----------------------------------------------------------------
function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16_384) throw Object.assign(new Error('body too large'), { status: 413 });
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw Object.assign(new Error('invalid JSON'), { status: 400 });
  }
}

// --- routing ------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (req.method === 'POST' && url.pathname === '/api/notes') {
      return sendJson(res, 201, await createNote(await readJsonBody(req)));
    }

    const answerMatch = url.pathname.match(/^\/api\/notes\/([A-Za-z0-9_-]{1,32})\/answer$/);
    if (req.method === 'POST' && answerMatch) {
      const proto = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
      return sendJson(res, 200, await answerNote(answerMatch[1], await readJsonBody(req), `${proto}://${host}`));
    }

    const noteMatch = url.pathname.match(/^\/api\/notes\/([A-Za-z0-9_-]{1,32})$/);
    if (req.method === 'GET' && noteMatch) {
      return sendJson(res, 200, await readNote(noteMatch[1]));
    }

    if (url.pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'not found' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'method not allowed' });
    return await serveStatic(res, url.pathname);
  } catch (error) {
    const status = (error instanceof NoteError && error.status) || error.status || 500;
    if (status >= 500) console.error('[server]', error);
    sendJson(res, status, { error: status >= 500 ? 'something dramatic went wrong' : error.message });
  }
});

server.listen(PORT, () => {
  console.log(`sky notes flying at http://localhost:${PORT}`);
  console.log(`storage: ${backend()} · email: ${process.env.RESEND_API_KEY ? 'resend' : 'console fallback (no RESEND_API_KEY)'}`);
});
