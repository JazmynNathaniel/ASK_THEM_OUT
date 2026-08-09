// The only file that looks elements up. Everyone else imports them from here,
// so if an id changes in index.html there is exactly one place to fix.

export const app = document.querySelector('.love-note-app');
export const note = document.getElementById('note');
export const message = document.getElementById('message');
export const aside = document.getElementById('aside');
export const choices = document.getElementById('choices');
export const blushFill = document.getElementById('blushFill');
export const chaosFill = document.getElementById('chaosFill');
export const blushText = document.getElementById('blushText');
export const chaosText = document.getElementById('chaosText');
export const trail = document.getElementById('trail');
export const warning = document.getElementById('warning');
export const burstLayer = document.getElementById('burstLayer');
export const secretHeart = document.getElementById('secretHeart');
export const nameInput = document.getElementById('nameInput');
export const eyebrow = document.querySelector('.eyebrow');
