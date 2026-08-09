// Wiring. Owns the state object, connects clicks to logic to rendering,
// and boots the note.

import { choices, secretHeart } from './dom.js';
import { actionCopy, randomItem } from './copy.js';
import { createState, applyAction, pushTrail, clamp } from './logic.js';
import { wait, typeMessage, setWarning, setMood, meterUpdate, renderTrail, renderChoices } from './ui.js';
import { animateNote, popBurst, moveClouds } from './effects.js';
import { unlockSound, playTinySound } from './sound.js';

const state = createState();

async function handleChoice(action, sourceButton) {
  unlockSound();
  choices.classList.add('is-changing');
  playTinySound('flip');
  await wait(90);
  choices.replaceChildren();

  const result = applyAction(state, action);
  setMood(result.mood);
  setWarning(result.warningText);
  meterUpdate(state);
  pushTrail(state, action, result.text);
  renderTrail(state);
  animateNote(action);
  popBurst(sourceButton, result.burstCount);

  const completed = await typeMessage(result.text);
  if (completed) renderChoices(state, handleChoice);
  choices.classList.remove('is-changing');
}

async function unlockSecret() {
  unlockSound();
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
  meterUpdate(state);
  setWarning('EASTER EGG: tiny heart protocol activated.');
  const text = randomItem(actionCopy.secret);
  pushTrail(state, 'secret', text);
  renderTrail(state);
  popBurst(secretHeart, 24);
  const completed = await typeMessage(text);
  if (completed) renderChoices(state, handleChoice);
}

window.addEventListener('mousemove', moveClouds, { passive: true });
window.addEventListener('touchmove', moveClouds, { passive: true });
secretHeart.addEventListener('click', unlockSecret);

meterUpdate(state);
setMood('soft');
typeMessage(randomItem(actionCopy.start)).then((completed) => {
  if (completed) renderChoices(state, handleChoice);
});
