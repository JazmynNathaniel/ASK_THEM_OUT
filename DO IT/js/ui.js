// Rendering: everything that writes game state into the page — the typed
// message, meters, warnings, trail, and the choice buttons.

import { app, aside, message, warning, choices, trail, blushFill, chaosFill, blushText, chaosText } from './dom.js';
import { asides, BLUSH_LABELS, CHAOS_LABELS, randomItem } from './copy.js';
import { labelFor, getChoices } from './logic.js';
import { playTinySound } from './sound.js';

// Bumping the token cancels any typewriter loop already running — the old
// loop notices its token is stale and quietly gives up.
let typingToken = 0;

export function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function typeMessage(text) {
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

export function setMood(mood) {
  app.dataset.mood = mood;
  aside.textContent = randomItem(asides[mood] || asides.soft);
}

export function setWarning(text) {
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

export function meterUpdate(state) {
  blushFill.style.width = `${state.blush}%`;
  chaosFill.style.width = `${state.chaos}%`;
  blushText.textContent = labelFor(state.blush, BLUSH_LABELS);
  chaosText.textContent = labelFor(state.chaos, CHAOS_LABELS);
}

export function renderTrail(state) {
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

export function renderChoices(state, onChoice) {
  choices.replaceChildren();

  getChoices(state).forEach((choice, index) => {
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

    button.addEventListener('click', () => onChoice(choice.action, button));
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
