// Tiny synthesized paper noises via the Web Audio API. Browsers refuse to
// start audio before the user interacts, so nothing plays until unlockSound()
// is called from a click handler.

let soundReady = false;
let context = null;

export function unlockSound() {
  soundReady = true;
}

export function playTinySound(kind) {
  if (!soundReady) return;
  if (!window.AudioContext && !window.webkitAudioContext) return;

  if (!context) {
    try {
      context = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return;
    }
  }

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
