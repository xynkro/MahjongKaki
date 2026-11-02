// Original synthesized sound effects (Web Audio — no samples/recordings).
// Routed through ./haptics so every existing feedback call also plays a sound.
// Works on iOS Safari (unlike navigator.vibrate). Note iOS mutes Web Audio when the
// ring/silent switch is on silent; a page can't detect that.

let ctx: AudioContext | null = null;
let output: AudioNode | null = null;
let unlocked = false;
let enabled = true;
try { enabled = localStorage.getItem('mk_sound') !== '0'; } catch { /* private mode */ }

function getCtx(): AudioContext | null {
  // Before the first gesture audio can't start, and queued sounds would all fire at once.
  if (typeof window === 'undefined' || !unlocked || document.hidden) return null;
  if (ctx?.state === 'closed') { ctx = null; output = null; }
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
    // Phone speakers are small: boost, and let the compressor stop chords clipping.
    const master = ctx.createGain();
    master.gain.value = 1.8;
    const limiter = ctx.createDynamicsCompressor();
    master.connect(limiter);
    limiter.connect(ctx.destination);
    output = master;
  }
  // iOS reports 'interrupted' after a call or leaving the app, so anything but 'running' resumes.
  if (ctx.state !== 'running') ctx.resume().catch(() => {});
  return ctx;
}

function unlock() {
  unlocked = true;
  if (!enabled || ctx?.state === 'running') return;
  const c = getCtx(); if (!c) return;
  // iOS only starts audio that is actually played inside a gesture.
  const silent = c.createBufferSource();
  silent.buffer = c.createBuffer(1, 1, 22050);
  silent.connect(c.destination);
  silent.start();
}

if (typeof window !== 'undefined') {
  for (const ev of ['touchend', 'pointerup', 'click', 'keydown']) {
    window.addEventListener(ev, unlock, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
  });
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
  osc.connect(g); g.connect(output ?? c.destination);
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
  src.connect(bp); bp.connect(g); g.connect(output ?? c.destination);
  src.start();
  blip(175, 0.06, { type: 'triangle', vol: vol * 0.6 });
}

// One chip landing: a short bright tick + two inharmonic partials, ceramic not bell.
function clink(delay: number, vol = 0.2) {
  const c = getCtx(); if (!c) return;
  const t0 = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * 0.025);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
  const src = c.createBufferSource(); src.buffer = buf;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(hp); hp.connect(g); g.connect(output ?? c.destination);
  src.start(t0);
  const base = 2300 + Math.random() * 500;
  blip(base, 0.07, { vol: vol * 0.7, delay });
  blip(base * 1.51, 0.05, { vol: vol * 0.4, delay });
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
  win() {                                              // winning hand: rising run into a held chord
    if (!enabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      blip(f, 0.3, { type: 'triangle', vol: 0.24, delay: i * 0.09 }));
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(f =>
      blip(f, 0.95, { type: 'triangle', vol: 0.12, delay: 0.38 }));
    blip(2093, 0.5, { vol: 0.07, delay: 0.46 });
  },
  chips(count: number, delay = 0) {                    // chips landing: count roughly follows the size of the win
    if (!enabled) return;
    for (let i = 0; i < count; i++) clink(delay + i * 0.075 + Math.random() * 0.02);
  },
  loss() {                                             // you paid: low-key, no drama
    if (!enabled) return;
    blip(330, 0.22, { type: 'triangle', vol: 0.15 });
    blip(262, 0.32, { type: 'triangle', vol: 0.15, delay: 0.16 });
  },
  handDrawn() {                                        // wall ran out: neutral
    if (enabled) blip(392, 0.28, { type: 'triangle', vol: 0.13 });
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
