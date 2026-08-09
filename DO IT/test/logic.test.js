// Regression test for the game logic. Runs in plain Node (no browser, no
// dependencies): `npm test`. Exercises every branch of getChoices and the
// meter math for each action.

import { createState, applyAction, getChoices, clamp } from '../js/logic.js';
import { actionCopy } from '../js/copy.js';

let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ok: ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

function actions(state) {
  return getChoices(state).map((choice) => choice.action);
}

// Fresh note offers the opening quad.
const s = createState();
assert(JSON.stringify(actions(s)) === JSON.stringify(['yes', 'no', 'maybe', 'define']), 'turn 0 offers yes / no / maybe / define');

// Yes: +22 blush, +12 chaos, intense mood, big burst, text from the yes pool.
s.lastRenderedAt = Date.now();
let result = applyAction(s, 'yes');
assert(s.blush === 50 && s.chaos === 21, `yes moves meters to 50/21 (got ${s.blush}/${s.chaos})`);
assert(result.mood === 'intense' && result.burstCount === 22, 'yes: intense mood, 22 sparks');
assert(actionCopy.yes.some((t) => result.text.endsWith(t)), 'yes: message drawn from the yes pool');
assert(actions(s).includes('flirt') && actions(s).includes('intense'), 'after a yes the flirt branch opens');

// Escalate: intense unlocks the confession path, confess pushes blush past 82.
s.lastRenderedAt = Date.now();
applyAction(s, 'intense');
assert(s.confessionUnlocked, 'intense unlocks confession');
s.lastRenderedAt = Date.now();
applyAction(s, 'confess');
assert(s.blush >= 82, `confess pushes blush past 82 (got ${s.blush})`);
assert(actions(s)[0] === 'ending', 'confession branch leads with the absurd ending');

// Ending maxes both meters and swaps to the post-credits choices.
s.lastRenderedAt = Date.now();
result = applyAction(s, 'ending');
assert(s.blush === 100 && s.chaos === 100 && s.endingSeen, 'ending maxes meters and flags endingSeen');
assert(result.burstCount === 64, 'ending: 64 sparks');
assert(JSON.stringify(actions(s)) === JSON.stringify(['reset', 'yes']), 'after ending: reset / read again');

// Reset restores opening state.
s.lastRenderedAt = Date.now();
applyAction(s, 'reset');
assert(s.blush === 28 && s.chaos === 9 && s.turn === 0 && !s.endingSeen, 'reset restores the fresh note');

// The no branch: first no is dramatic with a warning, second is soft without.
const n = createState();
n.lastRenderedAt = Date.now();
result = applyAction(n, 'no');
assert(result.mood === 'dramatic' && result.warningText.includes('FAKE SYSTEM WARNING'), 'first no: dramatic + fake warning');
assert(n.blush === 23 && n.chaos === 25, `first no moves meters to 23/25 (got ${n.blush}/${n.chaos})`);
n.lastRenderedAt = Date.now();
result = applyAction(n, 'no');
assert(result.mood === 'soft' && result.warningText === '', 'second no: soft, no warning');
assert(n.chaos === 17, `second no eases chaos to 17 (got ${n.chaos})`);
assert(JSON.stringify(actions(n)) === JSON.stringify(['reset', 'flirt', 'yes']), 'two nos offer the gentle branch');

// Meters never leave 0..100.
assert(clamp(140) === 100 && clamp(-12) === 0, 'clamp pins meters to 0..100');

// Hesitating four seconds or more can get called out (it fires ~65% of the
// time, so try repeatedly).
let sawHesitation = false;
for (let i = 0; i < 60 && !sawHesitation; i += 1) {
  const h = createState();
  h.lastRenderedAt = Date.now() - 10_000;
  sawHesitation = applyAction(h, 'yes').text.includes('seconds to answer');
}
assert(sawHesitation, 'long hesitation gets noticed');

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nall logic tests passed');
