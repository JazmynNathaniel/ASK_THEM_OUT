// Tiny storage layer for love notes.
//
// In production (on Vercel) it uses Upstash Redis over its REST API — set
// KV_REST_API_URL + KV_REST_API_TOKEN (Vercel's Upstash integration injects
// these automatically). With no env vars set, it falls back to a local JSON
// file so the whole app runs on your laptop with zero setup.

const fs = require('fs');
const path = require('path');
const os = require('os');

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(REST_URL && REST_TOKEN);

// --- local file fallback -------------------------------------------------
// Vercel functions can only write to /tmp, so we keep the dev file there too.
const LOCAL_FILE = path.join(os.tmpdir(), 'love-notes.json');

function readLocal() {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeLocal(data) {
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
}

// --- Upstash REST helper -------------------------------------------------
async function redis(command) {
  const response = await fetch(REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });

  if (!response.ok) {
    throw new Error(`Upstash error ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.result;
}

// --- public API ----------------------------------------------------------
async function getNote(id) {
  if (useRedis) {
    const raw = await redis(['GET', `note:${id}`]);
    return raw ? JSON.parse(raw) : null;
  }

  return readLocal()[id] || null;
}

async function putNote(id, note) {
  if (useRedis) {
    // keep notes for 60 days, then let them fade away
    await redis(['SET', `note:${id}`, JSON.stringify(note), 'EX', 60 * 60 * 24 * 60]);
    return;
  }

  const data = readLocal();
  data[id] = note;
  writeLocal(data);
}

module.exports = { getNote, putNote, backend: useRedis ? 'redis' : 'local-file' };
