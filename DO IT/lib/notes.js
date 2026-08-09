// Shared note operations — the single source of truth for validation and the
// email policy. Both server.js (local dev) and the Vercel functions in api/
// call these.

import crypto from 'node:crypto';
import { getNote, putNote, backend } from './store.js';
import { sendAnswerEmail } from './email.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
const ANSWER_TYPES = new Set(['yes', 'no', 'maybe', 'soft-yes', 'flirt', 'crush']);

export class NoteError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function createNote(body) {
  const crushName = String(body.crushName || '').trim().slice(0, 18);
  const senderName = String(body.senderName || '').trim().slice(0, 40);
  const senderEmail = String(body.senderEmail || '').trim().toLowerCase();

  if (!crushName) throw new NoteError(400, 'write a name on the note first');
  if (!EMAIL_PATTERN.test(senderEmail) || senderEmail.length > 254) {
    throw new NoteError(400, 'that email looks fake, and not in a cute way');
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
  return { id, link: `/?note=${id}` };
}

// The crush-facing read: never expose the sender's email.
export async function readNote(id) {
  const note = await loadNote(id);
  return { id: note.id, crushName: note.crushName, senderName: note.senderName };
}

export async function answerNote(id, body, origin) {
  const answer = String(body.answer || '');
  const detail = String(body.detail || '').slice(0, 300);
  if (!ANSWER_TYPES.has(answer)) throw new NoteError(400, 'the note does not recognize that answer');

  const note = await loadNote(id);

  // Email once per kind of answer — a maybe that later becomes a confessed
  // crush is exactly the update the sender wants, but replays stay silent.
  const firstOfItsKind = !note.answers.some((a) => a.answer === answer);
  note.answers = note.answers.concat({ answer, detail, at: new Date().toISOString() }).slice(-50);
  await putNote(id, note);

  let emailed = false;
  if (firstOfItsKind) {
    const outcome = await sendAnswerEmail(note.senderEmail, {
      senderName: note.senderName,
      crushName: note.crushName,
      answer,
      detail,
      link: `${origin}/?note=${id}`
    });
    emailed = outcome.emailed;
  }

  return { ok: true, emailed };
}

async function loadNote(id) {
  const note = ID_PATTERN.test(id) ? await getNote(id) : null;
  if (!note) throw new NoteError(404, 'this note has faded away');
  return note;
}

// For the Vercel functions: map an error onto their Express-style response.
export function sendApiError(res, error) {
  const status = error instanceof NoteError ? error.status : 500;
  if (status >= 500) console.error('[api]', error);
  res.status(status).json({ error: status >= 500 ? 'something dramatic went wrong' : error.message });
}
