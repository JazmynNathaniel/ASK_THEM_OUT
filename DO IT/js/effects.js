// Visual theatrics: the note's reaction animations, the spark bursts, and the
// cloud parallax that follows the pointer.

import { app, note, burstLayer } from './dom.js';
import { SPARK_COLORS } from './copy.js';

const cloudLayers = Array.from(document.querySelectorAll('.cloud-layer'));

export function animateNote(action) {
  note.classList.remove('is-flipping', 'is-dramatic', 'is-soft', 'is-ending');

  window.requestAnimationFrame(() => {
    if (action === 'ending') note.classList.add('is-ending');
    else if (['no', 'guilt', 'intense'].includes(action)) note.classList.add('is-dramatic');
    else if (action === 'reset') note.classList.add('is-soft');
    else note.classList.add('is-flipping');
  });
}

export function popBurst(source, count) {
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
    spark.style.color = SPARK_COLORS[index % SPARK_COLORS.length];
    spark.style.setProperty('--tx', `${Math.random() * 260 - 130}px`);
    spark.style.setProperty('--ty', `${-80 - Math.random() * 160}px`);
    spark.style.setProperty('--spin', `${Math.random() * 300 - 150}deg`);
    spark.style.animationDelay = `${Math.random() * 120}ms`;

    burstLayer.appendChild(spark);
    spark.addEventListener('animationend', () => spark.remove(), { once: true });
    window.setTimeout(() => spark.remove(), 1400);
  }
}

export function moveClouds(event) {
  const point = event.touches ? event.touches[0] : event;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const x = (point.clientX || width / 2) - width / 2;
  const y = (point.clientY || height / 2) - height / 2;
  const nx = x / (width / 2);
  const ny = y / (height / 2);

  app.style.setProperty('--look-x', `${nx * 10}px`);
  app.style.setProperty('--look-y', `${ny * 8}px`);

  cloudLayers.forEach((layer) => {
    const speed = parseFloat(layer.dataset.speed) || 0.08;
    layer.style.transform = `translate3d(${nx * 30 * speed}px, ${ny * 12 * speed}px, 0)`;
  });
}
