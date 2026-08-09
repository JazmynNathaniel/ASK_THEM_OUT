// The game itself: state, how each action changes it, and which choices the
// note offers next. No DOM here — this file runs (and is tested) in plain Node.

import { actionCopy, TRAIL_LABELS, randomItem } from './copy.js';

export function createState() {
  return {
    blush: 28,
    chaos: 9,
    turn: 0,
    lastRenderedAt: Date.now(),
    yesCount: 0,
    maybeCount: 0,
    noCount: 0,
    confessionUnlocked: false,
    endingSeen: false,
    secretTaps: 0,
    trail: []
  };
}

export function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

export function labelFor(value, labels) {
  if (value >= 86) return labels[4];
  if (value >= 64) return labels[3];
  if (value >= 38) return labels[2];
  if (value >= 18) return labels[1];
  return labels[0];
}

function timeNotice(state) {
  const seconds = Math.round((Date.now() - state.lastRenderedAt) / 1000);
  if (seconds >= 4 && Math.random() > 0.35) {
    return `You took ${seconds} seconds to answer. I noticed.`;
  }
  return '';
}

// Each action mutates the meters and returns how the note should react.
// Anything omitted falls back to: soft mood, no warning, 12 sparks.
const ACTION_EFFECTS = {
  yes(state) {
    state.yesCount += 1;
    state.blush += 22;
    state.chaos += 12;
    return { mood: 'intense', burstCount: 22 };
  },
  no(state) {
    state.noCount += 1;
    state.blush -= 5;
    state.chaos += state.noCount === 1 ? 16 : -8;
    return {
      mood: state.noCount >= 2 ? 'soft' : 'dramatic',
      warningText: state.noCount === 1 ? 'FAKE SYSTEM WARNING: heartbreak rehearsal detected.' : ''
    };
  },
  maybe(state) {
    state.maybeCount += 1;
    state.blush += 12;
    state.chaos += 24;
    return { mood: 'teasing', warningText: 'AMBIGUITY ALERT: delusions gaining confidence.' };
  },
  define(state) {
    state.blush += 10;
    state.chaos += 18;
    return { mood: 'teasing' };
  },
  flirt(state) {
    state.blush += 18;
    state.chaos += 18;
    return { mood: 'intense', burstCount: 18 };
  },
  guilt(state) {
    state.blush += 10;
    state.chaos += 22;
    return { mood: 'dramatic', warningText: 'FAKE GUILT TRIP ACTIVE: ignore if inconvenient.' };
  },
  intense(state) {
    state.blush += 20;
    state.chaos += 26;
    state.confessionUnlocked = true;
    return { mood: 'intense', warningText: 'SUSPICIOUSLY INTENSE AFFECTION DETECTED.', burstCount: 20 };
  },
  dodge(state) {
    state.blush += 8;
    state.chaos += 16;
    return { mood: 'teasing' };
  },
  confess(state) {
    state.blush += 24;
    state.chaos += 20;
    state.confessionUnlocked = true;
    return { mood: 'intense', warningText: 'CONFESSION PATH UNLOCKED.', burstCount: 28 };
  },
  ending(state) {
    state.blush = 100;
    state.chaos = 100;
    state.endingSeen = true;
    return { mood: 'dramatic', warningText: 'ROMANTIC CONTAINMENT FAILURE. THIS IS FINE.', burstCount: 64 };
  },
  reset(state) {
    Object.assign(state, {
      blush: 28,
      chaos: 9,
      turn: 0,
      yesCount: 0,
      maybeCount: 0,
      noCount: 0,
      confessionUnlocked: false,
      endingSeen: false
    });
    return { mood: 'soft' };
  }
};

export function applyAction(state, action) {
  const hesitation = timeNotice(state);
  let text = randomItem(actionCopy[action] || actionCopy.start);

  if (hesitation && action !== 'reset') {
    text = `${hesitation} ${text}`;
  }

  state.turn += 1;

  const effect = ACTION_EFFECTS[action] || (() => ({}));
  const { mood = 'soft', warningText = '', burstCount = 12 } = effect(state);

  state.blush = clamp(state.blush);
  state.chaos = clamp(state.chaos);

  return { text, mood, warningText, burstCount };
}

export function getChoices(state) {
  if (state.endingSeen) {
    return [
      { action: 'reset', label: 'Pass a new note', sub: 'pretend to recover', tone: 'mint' },
      { action: 'yes', label: 'Read it again', sub: 'smugly', tone: 'pink' }
    ];
  }

  if (state.confessionUnlocked && state.blush >= 82) {
    return [
      { action: 'ending', label: 'Absurd ending', sub: 'no dignity remains', tone: 'violet', dramatic: true },
      { action: 'confess', label: 'Say it softer', sub: 'dangerously sincere', tone: 'pink' },
      { action: 'guilt', label: 'Fake guilt trip', sub: 'with sparkle', tone: 'lemon' },
      { action: 'dodge', label: 'Be normal', sub: 'not available', tone: 'mint', morph: 'Immediately fail' }
    ];
  }

  if (state.turn === 0) {
    return [
      { action: 'yes', label: 'Yes', sub: 'obviously', tone: 'pink' },
      { action: 'no', label: 'No', sub: 'dangerous button', tone: 'mint', dodge: true },
      { action: 'maybe', label: 'Maybe', sub: 'make it worse', tone: 'lemon' },
      { action: 'define', label: 'Define "like"', sub: 'lawyer mode', tone: 'violet' }
    ];
  }

  if (state.noCount >= 2) {
    return [
      { action: 'reset', label: 'New note', sub: 'fresh paper', tone: 'mint' },
      { action: 'flirt', label: 'Compliment the note', sub: 'safer', tone: 'lemon' },
      { action: 'yes', label: 'Fine, tiny yes', sub: 'only if true', tone: 'pink' }
    ];
  }

  if (state.chaos >= 70) {
    return [
      { action: 'intense', label: 'Hypothetically...', sub: 'if we got married', tone: 'violet' },
      { action: 'guilt', label: 'Fake guilt trip', sub: 'ethically dramatic', tone: 'lemon' },
      { action: 'confess', label: 'Confess', sub: 'stop pretending', tone: 'pink' },
      { action: 'dodge', label: 'Play it cool', sub: 'it moves', tone: 'mint', dodge: true }
    ];
  }

  if (state.yesCount >= 1 || state.maybeCount >= 1) {
    return [
      { action: 'flirt', label: 'Flirt back', sub: 'bold choice', tone: 'pink' },
      { action: 'intense', label: 'Escalate', sub: 'suspicious affection', tone: 'violet' },
      { action: 'guilt', label: 'Fake guilt trip', sub: 'cute manipulation', tone: 'lemon' },
      { action: 'no', label: 'Walk it back', sub: 'respectfully', tone: 'mint' }
    ];
  }

  return [
    { action: 'yes', label: 'Yes', sub: 'say it again', tone: 'pink' },
    { action: 'maybe', label: 'Maybe', sub: 'stay mysterious', tone: 'lemon' },
    { action: 'define', label: 'Define terms', sub: 'annoying but hot', tone: 'violet' },
    { action: 'dodge', label: 'Act normal', sub: 'impossible', tone: 'mint', morph: 'Panic cutely' }
  ];
}

export function pushTrail(state, action, text) {
  state.trail.unshift({
    label: TRAIL_LABELS[action] || 'passed note',
    text
  });
  state.trail = state.trail.slice(0, 5);
}
