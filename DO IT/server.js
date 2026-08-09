// Zero-dependency server: static files + the note API.
//
//   node server.js   →  http://localhost:3000
//
// All configuration is optional (see README.md): PORT, RESEND_API_KEY,
// MAIL_FROM, KV_REST_API_URL, KV_REST_API_TOKEN. A .env file next to this
// file is loaded automatically at boot.

import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getNote, putNote, backend } from './lib/store.js';
import { sendAnswerEmail } from './lib/email.js';

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
const PRIVATE = ['server.js', 'package.json', 'lib', 'test'];

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
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ANSWER_TYPES = new Set(['yes', 'no', 'maybe', 'soft-yes', 'flirt', 'crush']);

// --- API --------------------------------------------------------------------
async function createNote(req, res) {
  const body = await readJsonBody(req).catch(() => null);
  if (!body) return sendJson(res, 400, { error: 'invalid JSON' });

  const crushName = String(body.crushName || '').trim().slice(0, 18);
  const senderName = String(body.senderName || '').trim().slice(0, 40);
  const senderEmail = String(body.senderEmail || '').trim().toLowerCase();

  if (!crushName) return sendJson(res, 400, { error: 'write a name on the note first' });
  if (!EMAIL_PATTERN.test(senderEmail) || senderEmail.length > 254) {
    return sendJson(res, 400, { error: 'that email looks fake, and not in a cute way' });
  }

  const id = crypto.randomBytes(6).toString('base64url');
  await putNote(id, {
    id,
    crushName,
    senderName: senderName || null,
    senderEmail,
    createdAt: new Date().toISOString(),
    answers: []
  });

  console.log(`[notes] created ${id} for "${crushName}" (storage: ${backend()})`);
  sendJson(res, 201, { id, link: `/?note=${id}` });
}

// The crush-facing read: never expose the sender's email.
async function readNote(res, id) {
  const note = await getNote(id);
  if (!note) return sendJson(res, 404, { error: 'this note has faded away' });
  sendJson(res, 200, { id: note.id, crushName: note.crushName, senderName: note.senderName });
}

async function answerNote(req, res, id) {
  const body = await readJsonBody(req).catch(() => null);
  if (!body) return sendJson(res, 400, { error: 'invalid JSON' });

  const answer = String(body.answer || '');
  const detail = String(body.detail || '').slice(0, 300);
  if (!ANSWER_TYPES.has(answer)) return sendJson(res, 400, { error: 'the note does not recognize that answer' });

  const note = await getNote(id);
  if (!note) return sendJson(res, 404, { error: 'this note has faded away' });

  // Email once per kind of answer — a maybe that later becomes a confessed
  // crush is exactly the update the sender wants, but replays stay silent.
  const firstOfItsKind = !note.answers.some((a) => a.answer === answer);
  note.answers = note.answers.concat({ answer, detail, at: new Date().toISOString() }).slice(-50);
  await putNote(id, note);

  let emailed = false;
  if (firstOfItsKind) {
    const proto = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
    const outcome = await sendAnswerEmail(note.senderEmail, {
      senderName: note.senderName,
      crushName: note.crushName,
      answer,
      detail,
      link: `${proto}://${host}/?note=${id}`
    });
    emailed = outcome.emailed;
  }

  sendJson(res, 200, { ok: true, emailed });
}

// --- routing ------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (req.method === 'POST' && url.pathname === '/api/notes') return await createNote(req, res);

    const answerMatch = url.pathname.match(/^\/api\/notes\/([A-Za-z0-9_-]{1,32})\/answer$/);
    if (req.method === 'POST' && answerMatch) return await answerNote(req, res, answerMatch[1]);

    const noteMatch = url.pathname.match(/^\/api\/notes\/([A-Za-z0-9_-]{1,32})$/);
    if (req.method === 'GET' && noteMatch) return await readNote(res, noteMatch[1]);

    if (url.pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'not found' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'method not allowed' });
    return await serveStatic(res, url.pathname);
  } catch (error) {
    console.error('[server]', error);
    sendJson(res, error.status || 500, { error: 'something dramatic went wrong' });
  }
});

server.listen(PORT, () => {
  console.log(`sky notes flying at http://localhost:${PORT}`);
  console.log(`storage: ${backend()} · email: ${process.env.RESEND_API_KEY ? 'resend' : 'console fallback (no RESEND_API_KEY)'}`);
});
