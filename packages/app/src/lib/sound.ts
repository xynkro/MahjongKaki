// Original synthesized sound effects (Web Audio — no samples/recordings).
// Routed through ./haptics so every existing feedback call also plays a sound.
// Works on iOS Safari (unlike navigator.vibrate); the AudioContext is created
// and resumed on the first user gesture (a tile tap), satisfying autoplay rules.

let ctx: AudioContext | null = null;
let enabled = true;
try { enabled = localStorage.getItem('mk_sound') !== '0'; } catch { /* private mode */ }

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

interface BlipOpts { type?: OscillatorType; vol?: number; slideTo?: number; delay?: number }

function blip(freq: number, dur: number, opts: BlipOpts = {}) {
  const c = getCtx(); if (!c) return;
  const t0 = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.slideTo), t0 + dur);
  const vol = opts.vol ?? 0.2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(c.destination);
  osc.start(t0); osc.stop(t0 + dur + 0.03);
}

// Woody tile "clack" — short filtered noise burst + a low body tone.
function clack(vol = 0.22) {
  const c = getCtx(); if (!c) return;
  const len = Math.floor(c.sampleRate * 0.05);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 850; bp.Q.value = 1.1;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(bp); bp.connect(g); g.connect(c.destination);
  src.start();
  blip(175, 0.06, { type: 'triangle', vol: vol * 0.6 });
}

export const sound = {
  get enabled() { return enabled; },
  setEnabled(v: boolean) {
    enabled = v;
    try { localStorage.setItem('mk_sound', v ? '1' : '0'); } catch { /* ignore */ }
  },
  tap() { if (enabled) clack(0.16); },                 // tile/button tap
  select() { if (enabled) clack(0.26); },              // discard / place / claim
  success() {                                          // win — gentle arpeggio
    if (!enabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      blip(f, 0.32, { type: 'triangle', vol: 0.2, delay: i * 0.085 }));
  },
  flower() {                                           // bright two-note chime
    if (!enabled) return;
    blip(1318.5, 0.18, { type: 'sine', vol: 0.2 });
    blip(1760, 0.24, { type: 'sine', vol: 0.17, delay: 0.07 });
  },
  error() { if (enabled) blip(150, 0.18, { type: 'square', vol: 0.16, slideTo: 95 }); },
  draw() {                                              // soft "pick up" rising blip
    if (enabled) blip(440, 0.13, { type: 'sine', vol: 0.13, slideTo: 680 });
  },
  throw() {                                             // discard: a downward whoosh + clack
    if (!enabled) return;
    blip(560, 0.12, { type: 'triangle', vol: 0.14, slideTo: 240 });
    clack(0.3);
  },
};
