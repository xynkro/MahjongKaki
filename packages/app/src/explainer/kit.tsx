// Building blocks for the lesson explainer videos. Everything is drawn from time `t` (seconds),
// never from CSS animation, so the renderer can step frame by frame and get the same picture every run.
import type { CSSProperties, ReactNode } from 'react';
import { TileFace } from '../components/game/TileFace';

export interface Word { w: string; s: number; e: number }
export interface SceneData { audio: string; dur: number; words: Word[] }
export interface ExplainerData { id: string; title: string; unit: string; scenes: SceneData[] }

/** Silence after each scene's narration before the next one starts. */
export const GAP = 1.0;
export const W = 720;
export const H = 1280;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** 0→1 over [start, start + len], eased. */
export function ease(t: number, start: number, len = 0.5) {
  const x = clamp((t - start) / len);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Start time of the nth word in a scene that begins with `prefix` (case and punctuation ignored). */
export function at(scene: SceneData, prefix: string, nth = 0): number {
  const want = prefix.toLowerCase();
  let seen = 0;
  for (const w of scene.words) {
    if (w.w.toLowerCase().replace(/[^a-z0-9-]/g, '').startsWith(want)) {
      if (seen === nth) return w.s;
      seen++;
    }
  }
  throw new Error(`word "${prefix}" #${nth} not in scene`);
}

export function sceneStarts(data: ExplainerData): number[] {
  const out: number[] = [];
  let t = 0.4;
  for (const s of data.scenes) { out.push(t); t += s.dur + GAP; }
  return out;
}
export const totalDuration = (data: ExplainerData) => {
  const st = sceneStarts(data);
  return st[st.length - 1] + data.scenes[data.scenes.length - 1].dur + GAP + 0.6;
};

const IVORY = 'linear-gradient(to bottom, #FBF4E4 0%, #F1E7D2 55%, #E4D2AC 100%)';

/** A face-up tile, the same face the app draws. */
export function Tile({ index, w = 64, style }: { index: number; w?: number; style?: CSSProperties }) {
  return (
    <div
      className="relative rounded-[9px] flex items-center justify-center overflow-hidden border border-[#C6AE84]"
      style={{ width: w, height: w * 1.39, backgroundImage: IVORY, boxShadow: '0 3px 0 #C6AE84, 0 6px 14px rgba(0,0,0,0.35)', ...style }}
    >
      <TileFace index={index} size="md" />
    </div>
  );
}

/** A face-down tile seen from above: green back with an ivory edge underneath. */
export function TileBack({ w = 64, style }: { w?: number; style?: CSSProperties }) {
  return (
    <div
      className="rounded-[9px]"
      style={{
        width: w, height: w * 1.39,
        background: 'linear-gradient(160deg, #3f8a63 0%, #2f6b4b 60%, #275a3f 100%)',
        boxShadow: `0 ${w * 0.08}px 0 #EADBB9, 0 ${w * 0.08 + 1}px 0 #C6AE84, 0 ${w * 0.14}px 16px rgba(0,0,0,0.4)`,
        ...style,
      }}
    />
  );
}

/** A stack seen side-on from the front: two tiles, green backs up, ivory faces hidden. `n` = 1 or 2. */
export function StackSide({ w = 34, n = 2, glow = false }: { w?: number; n?: 1 | 2; glow?: boolean }) {
  const h = w * 0.62;
  return (
    <div className="flex flex-col-reverse" style={{ width: w }}>
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          style={{
            height: h, marginTop: i ? -1 : 0, borderRadius: 4,
            background: 'linear-gradient(to bottom, #3f8a63 0 34%, #F3E9D3 34% 100%)',
            border: '1px solid #b9a27a',
            boxShadow: glow ? '0 0 0 2px #f2c14e, 0 0 16px rgba(242,193,78,0.7)' : '0 2px 3px rgba(0,0,0,0.35)',
          }}
        />
      ))}
    </div>
  );
}

/** Green felt stage. */
export function Felt({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="absolute rounded-[36px] overflow-hidden"
      style={{
        left: 32, right: 32, top: 210, height: 700,
        background: 'radial-gradient(ellipse at 50% 40%, #236250 0%, #1d5240 45%, #143a2c 100%)',
        boxShadow: 'inset 0 0 0 10px #5a3a22, inset 0 0 0 12px #3b2414, 0 20px 50px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Big label that fades and rises in at `from`. */
export function Pop({ t, from, children, style }: { t: number; from: number; children: ReactNode; style?: CSSProperties }) {
  const k = ease(t, from, 0.4);
  return (
    <div style={{ opacity: k, transform: `translateY(${(1 - k) * 18}px) scale(${0.94 + 0.06 * k})`, ...style }}>{children}</div>
  );
}

/** The narration line, with the words already said in full white and the rest dimmed. */
export function Captions({ scene, t }: { scene: SceneData; t: number }) {
  // Show one sentence at a time: the one holding the current word.
  const sentences: Word[][] = [[]];
  for (const w of scene.words) {
    sentences[sentences.length - 1].push(w);
    if (/[.?!]$/.test(w.w)) sentences.push([]);
  }
  const live = sentences.filter(s => s.length);
  const cur = live.find(s => t < s[s.length - 1].e + 0.15) ?? live[live.length - 1];
  return (
    <div className="absolute left-12 right-12 text-center" style={{ top: 960 }}>
      <p className="font-display font-semibold leading-[1.25]" style={{ fontSize: 40, letterSpacing: '-0.01em' }}>
        {cur.map((w, i) => (
          <span key={i} style={{ color: t >= w.s ? '#f2f0ea' : 'rgba(242,240,234,0.38)' }}>{w.w} </span>
        ))}
      </p>
    </div>
  );
}
