const app = document.querySelector('.love-note-app');
const note = document.getElementById('note');
const message = document.getElementById('message');
const aside = document.getElementById('aside');
const choices = document.getElementById('choices');
const blushFill = document.getElementById('blushFill');
const chaosFill = document.getElementById('chaosFill');
const blushText = document.getElementById('blushText');
const chaosText = document.getElementById('chaosText');
const trail = document.getElementById('trail');
const warning = document.getElementById('warning');
const burstLayer = document.getElementById('burstLayer');
const secretHeart = document.getElementById('secretHeart');

const state = {
  blush: 28,
  chaos: 9,
  turn: 0,
  lastRenderedAt: Date.now(),
  lastAction: 'start',
  yesCount: 0,
  maybeCount: 0,
  noCount: 0,
  defineCount: 0,
  confessionUnlocked: false,
  endingSeen: false,
  secretTaps: 0,
  trail: []
};

const sparkColors = ['#ff5c8a', '#ff8b63', '#ffe45c', '#56d6c4', '#7c6cff'];
let typingToken = 0;
let soundReady = false;

const actionCopy = {
  start: [
    'Choose carefully. This note has already been forwarded to my delusions.',
    'This is a very normal note with a completely unreasonable amount of emotional weather inside it.',
    'Do you like me? Be honest, but also consider my beautiful fragile confidence.'
  ],
  yes: [
    'I knew you liked me. I will now become unbearable in a charming way.',
    'Oh... so you smiled before clicking that? Interesting. VERY interesting.',
    'Yes? Gorgeous. I have updated the imaginary wedding seating chart.'
  ],
  no: [
    'Wrong answer. Try again. Kidding. Mostly. Respectfully devastated.',
    'Okay. Boundaries are attractive, which is inconvenient because now you still seem hot.',
    'No received. The note is folding itself with dignity and one dramatic sniff.'
  ],
  maybe: [
    'Maybe is just yes wearing sunglasses. I will not be taking questions.',
    'A maybe? That is not an answer. That is emotional origami.',
    'You are making me earn it, which is rude because it is working.'
  ],
  define: [
    'Define "like"? Bold. Legalistic. Deeply annoying. Continue.',
    'Like, as in I check my phone and pretend I was not checking my phone.',
    'Like, as in this note has entered evidence and the evidence is your face.'
  ],
  flirt: [
    'That was flirting. Do not look surprised. The note saw everything.',
    'You flirted and the room temperature changed. I am contacting science.',
    'Careful. I am one cute sentence away from becoming a person with plans.'
  ],
  guilt: [
    'Wow. After all the imaginary scenarios I lovingly invented for us? Brave.',
    'I am not upset. I am simply forwarding this note to my delusions for peer review.',
    'This is a fake guilt trip. The affection is real. The prosecution rests.'
  ],
  intense: [
    'Okay but hypothetically... if we got married... would you pretend this was your idea?',
    'I like you in a way that makes me act normal with suspicious intensity.',
    'I am being casual about this with the energy of someone absolutely not being casual.'
  ],
  dodge: [
    'You tried to press the reasonable option and it dodged. The interface has chosen chaos.',
    'The button moved because it sensed accountability approaching.',
    'Interesting. Even the UI is sabotaging emotional restraint.'
  ],
  confess: [
    'Fine. I have a crush on you. It is embarrassing, charming, and very well funded.',
    'Confession: I want you to like me in a way that ruins my ability to act mysterious.',
    'I like you. There. The note has thrown itself on the floor and is awaiting applause.'
  ],
  ending: [
    'ABSURD ENDING: We become unbearably cute, deny everything, and still somehow hold hands in the credits.',
    'FINAL NOTE: I like you. You like me. My delusions would like to thank the academy.',
    'Dramatic conclusion: the note explodes into hearts and leaves behind one very smug yes.'
  ],
  reset: [
    'Fresh note. Same question. Cleaner handwriting. Slightly worse intentions.',
    'The note has been reset, but emotionally it remembers everything.',
    'New note. New chances. Same suspicious amount of eye contact.'
  ],
  secret: [
    'Easter egg unlocked: the note admits it has been practicing your name in cursive.',
    'Hidden note: if you keep tapping hearts, the delusions get a budget increase.',
    'Secret confession: the UI is rooting for you two. Obviously.'
  ]
};

const asides = {
  soft: [
    'The note is pretending this is casual.',
    'A tiny heart has appeared in the margin and refuses to explain itself.',
    'The paper is warm for reasons no one can prove.'
  ],
  teasing: [
    'The note has started taking screenshots with its feelings.',
    'Your hesitation has been noticed and exaggerated.',
    'The delusions have opened a shared folder.'
  ],
  dramatic: [
    'SYSTEM WARNING: romantic containment failure.',
    'A fake heartbreak siren is going off somewhere tasteful.',
    'The note is lying face-down for theatrical reasons.'
  ],
  intense: [
    'Affection levels are suspiciously high.',
    'The note has become legally too fond of you.',
    'The flirting has developed a five-year plan.'
  ]
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function labelFor(value, labels) {
  if (value >= 86) return labels[4];
  if (value >= 64) return labels[3];
  if (value >= 38) return labels[2];
  if (value >= 18) return labels[1];
  return labels[0];
}

function setMood(mood) {
  app.dataset.mood = mood;
  aside.textContent = randomItem(asides[mood] || asides.soft);
}

function meterUpdate() {
  blushFill.style.width = `${state.blush}%`;
  chaosFill.style.width = `${state.chaos}%`;
  blushText.textContent = labelFor(state.blush, [
    'composed',
    'warming up',
    'visibly cute',
    'fully blushing',
    'emergency cheeks'
  ]);
  chaosText.textContent = labelFor(state.chaos, [
    'plausible',
    'spiraling',
    'dramatic',
    'delusional',
    'public statement'
  ]);
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function typeMessage(text) {
  const token = (typingToken += 1);
  message.textContent = '';
  message.classList.add('is-typing');

  for (let index = 0; index < text.length; index += 1) {
    if (token !== typingToken) return false;
    message.textContent += text[index];
    if (index % 3 === 0) playTinySound('scratch');
    await wait(14 + Math.random() * 18);
  }

  if (token !== typingToken) return false;
  message.classList.remove('is-typing');
  return true;
}

function setWarning(text) {
  if (!text) {
    warning.hidden = true;
    warning.textContent = '';
    return;
  }

  warning.hidden = false;
  warning.textContent = text;
  warning.classList.remove('is-flashing');
  window.requestAnimationFrame(() => warning.classList.add('is-flashing'));
}

function addTrail(action, text) {
  const labels = {
    yes: 'circled yes',
    no: 'tried no',
    maybe: 'made it complicated',
    define: 'asked for terms',
    flirt: 'flirted back',
    guilt: 'got dramatic',
    intense: 'escalated',
    dodge: 'dodged feelings',
    confess: 'confessed',
    ending: 'went full chaos',
    secret: 'found a secret'
  };

  state.trail.unshift({
    label: labels[action] || 'passed note',
    text
  });
  state.trail = state.trail.slice(0, 5);
  renderTrail();
}

function renderTrail() {
  trail.replaceChildren();

  state.trail.forEach((item) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    const span = document.createElement('span');
    strong.textContent = item.label;
    span.textContent = item.text;
    li.append(strong, span);
    trail.appendChild(li);
  });
}

function timeNotice() {
  const seconds = Math.round((Date.now() - state.lastRenderedAt) / 1000);
  if (seconds >= 4 && Math.random() > 0.35) {
    return `You took ${seconds} seconds to answer. I noticed.`;
  }
  return '';
}

function getChoices() {
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

function renderChoices() {
  choices.replaceChildren();
  const nextChoices = getChoices();

  nextChoices.forEach((choice, index) => {
    const button = document.createElement('button');
    const label = document.createElement('span');
    const sub = document.createElement('small');

    button.type = 'button';
    button.className = `choice choice-${choice.tone}`;
    button.dataset.action = choice.action;
    button.style.animationDelay = `${index * 52}ms`;
    if (choice.dodge) button.dataset.dodge = 'true';
    if (choice.morph) button.dataset.morph = choice.morph;
    if (choice.dramatic) button.dataset.dramatic = 'true';

    label.textContent = choice.label;
    sub.textContent = choice.sub;
    button.append(label, sub);

    button.addEventListener('click', () => handleChoice(choice.action, button));
    button.addEventListener('pointerenter', () => teaseButton(button));
    choices.appendChild(button);
  });

  state.lastRenderedAt = Date.now();
}

function teaseButton(button) {
  const morphText = button.dataset.morph;

  if (morphText && !button.dataset.morphed) {
    button.querySelector('span').textContent = morphText;
    button.dataset.morphed = 'true';
  }

  if (button.dataset.dodge !== 'true') return;

  button.style.setProperty('--dodge-x', `${Math.round(Math.random() * 42 - 21)}px`);
  button.style.setProperty('--dodge-y', `${Math.round(Math.random() * 24 - 12)}px`);
  button.classList.remove('is-dodging');
  window.requestAnimationFrame(() => button.classList.add('is-dodging'));
}

function applyAction(action) {
  const hesitation = timeNotice();
  let text = randomItem(actionCopy[action] || actionCopy.start);
  let mood = 'soft';
  let warningText = '';
  let burstCount = 12;

  if (hesitation && action !== 'reset') {
    text = `${hesitation} ${text}`;
  }

  state.turn += 1;
  state.lastAction = action;

  if (action === 'yes') {
    state.yesCount += 1;
    state.blush += 22;
    state.chaos += 12;
    mood = 'intense';
    burstCount = 22;
  }

  if (action === 'no') {
    state.noCount += 1;
    state.blush -= 5;
    state.chaos += state.noCount === 1 ? 16 : -8;
    mood = state.noCount >= 2 ? 'soft' : 'dramatic';
    warningText = state.noCount === 1 ? 'FAKE SYSTEM WARNING: heartbreak rehearsal detected.' : '';
  }

  if (action === 'maybe') {
    state.maybeCount += 1;
    state.blush += 12;
    state.chaos += 24;
    mood = 'teasing';
    warningText = 'AMBIGUITY ALERT: delusions gaining confidence.';
  }

  if (action === 'define') {
    state.defineCount += 1;
    state.blush += 10;
    state.chaos += 18;
    mood = 'teasing';
  }

  if (action === 'flirt') {
    state.blush += 18;
    state.chaos += 18;
    mood = 'intense';
    burstCount = 18;
  }

  if (action === 'guilt') {
    state.blush += 10;
    state.chaos += 22;
    mood = 'dramatic';
    warningText = 'FAKE GUILT TRIP ACTIVE: ignore if inconvenient.';
  }

  if (action === 'intense') {
    state.blush += 20;
    state.chaos += 26;
    mood = 'intense';
    warningText = 'SUSPICIOUSLY INTENSE AFFECTION DETECTED.';
    state.confessionUnlocked = true;
    burstCount = 20;
  }

  if (action === 'dodge') {
    state.blush += 8;
    state.chaos += 16;
    mood = 'teasing';
  }

  if (action === 'confess') {
    state.blush += 24;
    state.chaos += 20;
    mood = 'intense';
    state.confessionUnlocked = true;
    warningText = 'CONFESSION PATH UNLOCKED.';
    burstCount = 28;
  }

  if (action === 'ending') {
    state.blush = 100;
    state.chaos = 100;
    state.endingSeen = true;
    mood = 'dramatic';
    warningText = 'ROMANTIC CONTAINMENT FAILURE. THIS IS FINE.';
    burstCount = 64;
  }

  if (action === 'reset') {
    state.blush = 28;
    state.chaos = 9;
    state.turn = 0;
    state.yesCount = 0;
    state.maybeCount = 0;
    state.noCount = 0;
    state.defineCount = 0;
    state.confessionUnlocked = false;
    state.endingSeen = false;
    mood = 'soft';
    warningText = '';
  }

  state.blush = clamp(state.blush);
  state.chaos = clamp(state.chaos);

  return { text, mood, warningText, burstCount };
}

async function handleChoice(action, source) {
  soundReady = true;
  choices.classList.add('is-changing');
  playTinySound('flip');
  await wait(90);
  choices.replaceChildren();

  const result = applyAction(action);
  setMood(result.mood);
  setWarning(result.warningText);
  meterUpdate();
  addTrail(action, result.text);
  animateNote(action);
  popBurst(source, result.burstCount);

  const completed = await typeMessage(result.text);
  if (completed) renderChoices();
  choices.classList.remove('is-changing');
}

function animateNote(action) {
  note.classList.remove('is-flipping', 'is-dramatic', 'is-soft', 'is-ending');

  window.requestAnimationFrame(() => {
    if (action === 'ending') note.classList.add('is-ending');
    else if (['no', 'guilt', 'intense'].includes(action)) note.classList.add('is-dramatic');
    else if (action === 'reset') note.classList.add('is-soft');
    else note.classList.add('is-flipping');
  });
}

function popBurst(source, count) {
  const sourceRect = source.getBoundingClientRect();
  const appRect = app.getBoundingClientRect();
  const originX = sourceRect.left + sourceRect.width / 2 - appRect.left;
  const originY = sourceRect.top + sourceRect.height / 2 - appRect.top;

  for (let index = 0; index < count; index += 1) {
    const spark = document.createElement('span');
    const size = 7 + Math.random() * 13;

    spark.className = index % 3 === 0 ? 'spark spark-heart' : index % 3 === 1 ? 'spark spark-star' : 'spark';
    spark.style.left = `${originX}px`;
    spark.style.top = `${originY}px`;
    spark.style.width = `${size}px`;
    spark.style.height = `${size}px`;
    spark.style.color = sparkColors[index % sparkColors.length];
    spark.style.setProperty('--tx', `${Math.random() * 260 - 130}px`);
    spark.style.setProperty('--ty', `${-80 - Math.random() * 160}px`);
    spark.style.setProperty('--spin', `${Math.random() * 300 - 150}deg`);
    spark.style.animationDelay = `${Math.random() * 120}ms`;

    burstLayer.appendChild(spark);
    spark.addEventListener('animationend', () => spark.remove(), { once: true });
    window.setTimeout(() => spark.remove(), 1400);
  }
}

function playTinySound(kind) {
  if (!soundReady) return;
  if (!window.AudioContext && !window.webkitAudioContext) return;
  if (!playTinySound.context) {
    try {
      playTinySound.context = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return;
    }
  }

  const context = playTinySound.context;
  if (context.state === 'suspended') context.resume();

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = kind === 'flip' ? 'triangle' : 'sine';
  oscillator.frequency.value = kind === 'flip' ? 220 + Math.random() * 90 : 620 + Math.random() * 120;
  gain.gain.value = kind === 'flip' ? 0.018 : 0.006;
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + (kind === 'flip' ? 0.09 : 0.035));
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + (kind === 'flip' ? 0.09 : 0.035));
}

function moveClouds(event) {
  const layers = Array.from(document.querySelectorAll('.cloud-layer'));
  const point = event.touches ? event.touches[0] : event;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const x = (point.clientX || width / 2) - width / 2;
  const y = (point.clientY || height / 2) - height / 2;
  const nx = x / (width / 2);
  const ny = y / (height / 2);

  app.style.setProperty('--look-x', `${nx * 10}px`);
  app.style.setProperty('--look-y', `${ny * 8}px`);

  layers.forEach((layer) => {
    const speed = parseFloat(layer.dataset.speed) || 0.08;
    layer.style.transform = `translate3d(${nx * 30 * speed}px, ${ny * 12 * speed}px, 0)`;
  });
}

async function unlockSecret() {
  soundReady = true;
  state.secretTaps += 1;
  secretHeart.classList.add('is-tapped');
  window.setTimeout(() => secretHeart.classList.remove('is-tapped'), 240);

  if (state.secretTaps < 5) {
    popBurst(secretHeart, 5);
    return;
  }

  state.secretTaps = 0;
  state.blush = clamp(state.blush + 12);
  state.chaos = clamp(state.chaos + 8);
  setMood('intense');
  meterUpdate();
  setWarning('EASTER EGG: tiny heart protocol activated.');
  const text = randomItem(actionCopy.secret);
  addTrail('secret', text);
  popBurst(secretHeart, 24);
  const completed = await typeMessage(text);
  if (completed) renderChoices();
}

window.addEventListener('mousemove', moveClouds, { passive: true });
window.addEventListener('touchmove', moveClouds, { passive: true });
secretHeart.addEventListener('click', unlockSecret);

meterUpdate();
setMood('soft');
typeMessage(randomItem(actionCopy.start)).then((completed) => {
  if (completed) renderChoices();
});
