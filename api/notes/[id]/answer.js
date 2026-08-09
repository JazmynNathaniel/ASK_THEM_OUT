// POST /api/notes/:id/answer — record an answer; the first of each kind
// emails the sender.

import { answerNote, sendApiError } from '../../../lib/notes.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  try {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    res.status(200).json(await answerNote(String(req.query.id), req.body || {}, `${proto}://${host}`));
  } catch (error) {
    sendApiError(res, error);
  }
}
