// Talks to the server: creating a real note and reporting the crush's answers.
// Everything here degrades gracefully — with no server (or no ?note= in the
// URL) the game simply plays offline like it always did.

const params = new URLSearchParams(window.location.search);

// Present when someone opened a shared link; null when you're just playing.
export const noteId = params.get('note');

// Which game actions count as an answer worth emailing about, and what the
// email calls them. A yes after some no's reads as shy ("soft-yes").
function answerTypeFor(state, action) {
  if (action === 'yes') return state.noCount > 0 ? 'soft-yes' : 'yes';
  return { no: 'no', maybe: 'maybe', flirt: 'flirt', confess: 'crush', ending: 'crush' }[action] || null;
}

const reported = new Set();

export async function loadNote() {
  if (!noteId) return null;
  try {
    const response = await fetch(`/api/notes/${encodeURIComponent(noteId)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Fire-and-forget: never blocks or breaks the game if the server is away.
export function reportAnswer(state, action, detail) {
  if (!noteId) return;

  const answer = answerTypeFor(state, action);
  if (!answer || reported.has(answer)) return;
  reported.add(answer);

  fetch(`/api/notes/${encodeURIComponent(noteId)}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer, detail })
  }).catch(() => {});
}

export async function createNote(crushName, senderEmail) {
  let response;
  try {
    response = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crushName, senderEmail })
    });
  } catch {
    throw new Error('Could not reach the server — start it with `node server.js`.');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The note refused to send.');
  return body;
}
