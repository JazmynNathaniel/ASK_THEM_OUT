// Sends the "someone answered your note" email.
//
// In production set RESEND_API_KEY (and optionally MAIL_FROM). Without a key it
// just logs the email to the console and reports emailed:false, so the app runs
// end-to-end locally and you can see exactly what would have been sent.

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Resend's shared onboarding sender works out of the box but can only deliver
// to your own address. Point MAIL_FROM at a verified domain to email anyone.
const MAIL_FROM = process.env.MAIL_FROM || 'Sky Notes <onboarding@resend.dev>';

const ANSWER_COPY = {
  yes: { emoji: '💗', line: 'said YES.', vibe: 'Go be unbearably cute about it.' },
  no: { emoji: '🥀', line: 'said no.', vibe: 'Respectfully devastating. You have excellent taste regardless.' },
  maybe: { emoji: '🌀', line: 'is playing it coy (they picked "maybe").', vibe: 'A maybe is just a yes wearing sunglasses.' },
  'soft-yes': { emoji: '💞', line: 'gave you a shy little yes.', vibe: 'Adorable. Do not scare it off.' },
  flirt: { emoji: '😏', line: 'flirted back.', vibe: 'The temperature in the room has changed.' },
  crush: { emoji: '💌', line: 'admitted they have a crush on you.', vibe: 'This is not a drill.' }
};

function renderEmail({ senderName, crushName, answer, detail, link }) {
  const who = crushName ? crushName : 'Someone';
  const copy = ANSWER_COPY[answer] || ANSWER_COPY.maybe;
  const subject = `${copy.emoji} ${who} answered your note — they ${copy.line}`;

  const text = [
    `${who} answered the note you sent${senderName ? `, ${senderName}` : ''}.`,
    '',
    `They ${copy.line}`,
    detail ? `Their words: "${detail}"` : '',
    '',
    copy.vibe,
    link ? `\nRelive it: ${link}` : ''
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
  <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:28px;color:#173149">
    <div style="background:linear-gradient(180deg,#9be7ff,#ffe7ab);border-radius:16px;padding:26px;box-shadow:0 20px 60px rgba(24,72,96,.24)">
      <p style="margin:0 0 6px;color:#ff8b63;font-weight:900;text-transform:uppercase;font-size:12px;letter-spacing:.4px">secret sky note</p>
      <h1 style="margin:0 0 14px;font-size:26px;line-height:1.15">${copy.emoji} ${escapeHtml(who)} ${escapeHtml(copy.line)}</h1>
      ${detail ? `<p style="margin:0 0 12px;font-size:16px;font-style:italic;color:#263e53">“${escapeHtml(detail)}”</p>` : ''}
      <p style="margin:0 0 18px;font-size:15px;color:#3a5064">${escapeHtml(copy.vibe)}</p>
      ${link ? `<a href="${escapeAttr(link)}" style="display:inline-block;background:#ff5c8a;color:#fff;text-decoration:none;font-weight:800;padding:11px 18px;border-radius:999px">See the note</a>` : ''}
    </div>
    <p style="margin:16px 4px 0;color:#627587;font-size:12px">You got this because someone answered a note you made. 💌</p>
  </div>`;

  return { subject, text, html };
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );
}

const escapeAttr = escapeHtml;

async function sendAnswerEmail(to, details) {
  const { subject, text, html } = renderEmail(details);

  if (!RESEND_API_KEY) {
    console.log('\n[email fallback] would send to:', to);
    console.log('[email fallback] subject:', subject);
    console.log('[email fallback] body:\n' + text + '\n');
    return { emailed: false, reason: 'no RESEND_API_KEY set' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: MAIL_FROM, to, subject, text, html })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error('[email] Resend error', response.status, body);
    return { emailed: false, reason: `resend ${response.status}` };
  }

  return { emailed: true };
}

module.exports = { sendAnswerEmail };
