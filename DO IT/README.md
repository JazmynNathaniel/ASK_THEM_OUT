# ASK THAT BOY IF HE LIKES YOU

A dramatic little "do you like me?" note with a blush meter, a delusion index,
buttons that dodge accountability — and now a real answer pipeline: write his
name on the note, send him the link, and get an email the moment he answers.

## Run it

```
node server.js
```

Open http://localhost:3000. No dependencies, nothing to install (Node 18+).

- `npm test` — runs the game-logic regression tests in plain Node.
- The game also works as a pure static page (any static file server); only
  sending/answering notes needs `server.js`.

## How the note flies

1. You write their name on the note's "to:" line, drop your email in the
   **make it real** panel, and get a shareable link (`/?note=<id>`).
2. They open the link — the note is addressed to them — and play.
3. The first time they land on each kind of answer (yes, no, maybe, a shy
   yes, flirting, a full confessed crush), you get an email. Replays of the
   same answer stay silent, so nobody gets spammed.

The crush-facing API never exposes your email address.

## Configuration (all optional)

Set as environment variables or in a `.env` file next to `server.js`
(git-ignored):

| Variable | What it does | Without it |
| --- | --- | --- |
| `PORT` | server port | `3000` |
| `RESEND_API_KEY` | sends real email via [Resend](https://resend.com) | emails print to the server console |
| `MAIL_FROM` | verified sender, e.g. `Sky Notes <notes@yourdomain>` | Resend's onboarding sender (delivers only to your own address) |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | store notes in [Upstash Redis](https://upstash.com) with a 60-day TTL | JSON file in the OS temp dir |

## Layout

```
index.html, style.css   the page
js/                     browser code (ES modules)
  copy.js               all the words
  logic.js              game state machine (no DOM — tested in Node)
  dom.js                element lookups
  ui.js, effects.js, sound.js
  notes.js              client for the note API
  main.js               wiring + boot
server.js               zero-dependency static + API server
lib/store.js            note storage (Upstash Redis or local JSON)
lib/email.js            answer emails (Resend or console fallback)
test/logic.test.js      npm test
```
