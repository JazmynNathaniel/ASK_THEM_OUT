// POST /api/notes — create a note, get back its shareable link.

import { createNote, sendApiError } from '../../lib/notes.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  try {
    res.status(201).json(await createNote(req.body || {}));
  } catch (error) {
    sendApiError(res, error);
  }
}
