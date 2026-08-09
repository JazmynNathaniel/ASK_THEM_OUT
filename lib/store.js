// Tiny storage layer for love notes.
//
// In production it uses Upstash Redis over its REST API — set
// KV_REST_API_URL + KV_REST_API_TOKEN (Vercel's Upstash integration injects
// these automatically). With no env vars set, it falls back to a local JSON
// file so the whole app runs on your laptop with zero setup.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// --- local file fallback -------------------------------------------------
// Serverless platforms can only write to /tmp, so the dev file lives there too.
const LOCAL_FILE = path.join(os.tmpdir(), 'love-notes.json');

// Read at call time (not import time) so a .env file loaded at boot counts.
function redisConfig() {
  const env = process.env;

  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url, token };

  // Marketplace integrations let you pick a custom env-var prefix, so also
  // accept any <PREFIX>…_URL / <PREFIX>…_TOKEN REST pair we can find.
  for (const key of Object.keys(env)) {
    const match = key.match(/^(.*?)(KV_REST_API|REST_API|REDIS_REST)_URL$/);
    if (!match) continue;
    const pairedToken = env[`${match[1]}${match[2]}_TOKEN`];
    if (env[key] && pairedToken && env[key].startsWith('https://')) {
      return { url: env[key], token: pairedToken };
    }
  }

  return null;
}

export function backend() {
  return redisConfig() ? 'redis' : 'local-file';
}

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
  const { url, token } = redisConfig();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
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
export async function getNote(id) {
  if (redisConfig()) {
    const raw = await redis(['GET', `note:${id}`]);
    return raw ? JSON.parse(raw) : null;
  }

  return readLocal()[id] || null;
}

export async function putNote(id, note) {
  if (redisConfig()) {
    // keep notes for 60 days, then let them fade away
    await redis(['SET', `note:${id}`, JSON.stringify(note), 'EX', 60 * 60 * 24 * 60]);
    return;
  }

  const data = readLocal();
  data[id] = note;
  writeLocal(data);
}
