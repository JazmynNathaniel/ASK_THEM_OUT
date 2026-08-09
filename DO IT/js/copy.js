// All the words. What the note says, how it mutters in the margins, and what
// the trail calls each move. Pure data — no DOM, no state, no side effects.

export const actionCopy = {
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

export const asides = {
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

export const TRAIL_LABELS = {
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

export const BLUSH_LABELS = [
  'composed',
  'warming up',
  'visibly cute',
  'fully blushing',
  'emergency cheeks'
];

export const CHAOS_LABELS = [
  'plausible',
  'spiraling',
  'dramatic',
  'delusional',
  'public statement'
];

export const SPARK_COLORS = ['#ff5c8a', '#ff8b63', '#ffe45c', '#56d6c4', '#7c6cff'];

export function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}
