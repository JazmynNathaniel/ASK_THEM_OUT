// Wiring. Owns the state object, connects clicks to logic to rendering,
// and boots the note.

import { choices, secretHeart, nameInput, eyebrow, sendPanel, sendForm, senderEmail, sendResult } from './dom.js';
import { actionCopy, randomItem } from './copy.js';
import { createState, applyAction, pushTrail, clamp } from './logic.js';
import { wait, typeMessage, setWarning, setMood, meterUpdate, renderTrail, renderChoices } from './ui.js';
import { animateNote, popBurst, moveClouds } from './effects.js';
import { unlockSound, playTinySound } from './sound.js';
import { noteId, loadNote, reportAnswer, createNote } from './notes.js';

const state = createState();

async function handleChoice(action, sourceButton) {
  unlockSound();
  choices.classList.add('is-changing');
  playTinySound('flip');
  await wait(90);
  choices.replaceChildren();

  const result = applyAction(state, action);
  reportAnswer(state, action, result.text);
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

// --- sending the note for real ---------------------------------------------

async function onSendNote(event) {
  event.preventDefault();

  const crushName = nameInput.value.trim();
  if (!crushName) {
    setWarning('Write their name on the "to:" line first. The note needs a target.');
    nameInput.focus();
    return;
  }

  const button = sendForm.querySelector('button');
  button.disabled = true;
  button.textContent = 'folding the note…';

  try {
    const { link } = await createNote(crushName, senderEmail.value.trim());
    showSendResult(new URL(link, window.location.href).href);
    popBurst(sendPanel, 18);
  } catch (error) {
    setWarning(error.message);
    button.disabled = false;
    button.textContent = '✉️ pass this note for real';
  }
}

function showSendResult(url) {
  sendForm.hidden = true;

  const hint = document.createElement('p');
  hint.textContent = 'The note is airborne. Slide them this link:';

  const linkBox = document.createElement('input');
  linkBox.type = 'text';
  linkBox.readOnly = true;
  linkBox.value = url;
  linkBox.addEventListener('focus', () => linkBox.select());

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'send-button';
  copyButton.textContent = 'copy link';
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      copyButton.textContent = 'copied. go be brave.';
    } catch {
      linkBox.focus();
    }
  });

  sendResult.replaceChildren(hint, linkBox, copyButton);
  sendResult.hidden = false;
}

// --- boot --------------------------------------------------------------------

async function boot() {
  window.addEventListener('mousemove', moveClouds, { passive: true });
  window.addEventListener('touchmove', moveClouds, { passive: true });
  secretHeart.addEventListener('click', unlockSecret);
  sendForm.addEventListener('submit', onSendNote);

  // Opened from a shared link? Address the note to its crush and answer home.
  const noteData = await loadNote();
  if (noteData) {
    sendPanel.hidden = true;
    nameInput.value = noteData.crushName;
    nameInput.readOnly = true;
    eyebrow.textContent = `a secret sky note for ${noteData.crushName}`;
  } else if (noteId) {
    sendPanel.hidden = true;
    setWarning('This note has faded away — they only live 60 days. Someone will have to be brave again.');
  }

  meterUpdate(state);
  setMood('soft');
  const completed = await typeMessage(randomItem(actionCopy.start));
  if (completed) renderChoices(state, handleChoice);
}

boot();
