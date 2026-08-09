// GET /api/notes/:id — the crush-facing view of a note.

import { readNote, sendApiError } from '../../lib/notes.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });

  try {
    res.status(200).json(await readNote(String(req.query.id)));
  } catch (error) {
    sendApiError(res, error);
  }
}
