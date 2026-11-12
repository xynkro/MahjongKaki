// Explainer: Building the wall (Unit 3, lesson 1). Six scenes, one per narration line in data/wall.json.
import type { ReactNode } from 'react';
import { tileToIndex, suit, wind, dragon } from '@mahjongkaki/engine';
import { DiceFace } from '../components/game/Wall';
import { Felt, Pop, StackSide, Tile, TileBack, at, clamp, ease, lerp, type SceneData } from './kit';

const E = tileToIndex(wind('east'));
const S = tileToIndex(wind('south'));
const Wn = tileToIndex(wind('west'));
const N = tileToIndex(wind('north'));

// Felt is 656 × 700; its centre:
const CX = 328;
const CY = 350;

/** Deterministic pseudo-random in [0, 1). */
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const MIX = [
  tileToIndex(suit('bamboo', 3)), tileToIndex(suit('dot', 5)), tileToIndex(suit('character', 7)), E,
  tileToIndex(dragon('red')), tileToIndex(suit('bamboo', 8)), tileToIndex(suit('dot', 2)), S,
  tileToIndex(suit('character', 1)), tileToIndex(dragon('green')), tileToIndex(suit('dot', 9)), Wn,
  tileToIndex(suit('bamboo', 1)), N, tileToIndex(suit('character', 4)), tileToIndex(dragon('white')),
];

export function Abs({ x, y, rot = 0, children, z }: { x: number; y: number; rot?: number; children: ReactNode; z?: number }) {
  return (
    <div className="absolute" style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg)`, zIndex: z }}>{children}</div>
  );
}

export function Label({ children, size = 44, color = '#f2f0ea' }: { children: ReactNode; size?: number; color?: string }) {
  return (
    <div className="font-display font-bold text-center whitespace-nowrap" style={{ fontSize: size, color, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
      {children}
    </div>
  );
}

/* ---------- Scene 1: face down and wash ---------- */
function Wash({ s, t }: { s: SceneData; t: number }) {
  const tFace = at(s, 'face');
  const tMix = at(s, 'mixes');
  return (
    <Felt>
      {MIX.map((tile, i) => {
        const r0 = 90 + rnd(i) * 200;
        const a0 = rnd(i + 40) * Math.PI * 2;
        // Swirl starts when she says "mixes"; tiles drift a little before that.
        const spin = Math.max(0, t - tMix);
        const a = a0 + spin * (0.9 + rnd(i + 7) * 0.5) * (i % 2 ? 1 : -1) + Math.sin(t * 0.6 + i) * 0.03;
        const r = r0 + Math.sin(spin * 1.7 + i) * 26 * clamp(spin);
        const x = CX + Math.cos(a) * r;
        const y = CY + Math.sin(a) * r * 0.82;
        const rot = rnd(i + 90) * 80 - 40 + spin * 40 * (i % 2 ? 1 : -1);
        // Flip: squash to nothing, then grow back as the green back.
        const delay = tFace + i * 0.05;
        const k = clamp((t - delay) / 0.35);
        const showBack = k >= 0.5;
        const sx = Math.abs(1 - 2 * k);
        return (
          <Abs key={i} x={x} y={y} rot={rot} z={i}>
            <div style={{ transform: `scaleX(${sx})` }}>{showBack ? <TileBack w={58} /> : <Tile index={tile} w={58} />}</div>
          </Abs>
        );
      })}
      <Abs x={CX} y={86} z={50}><Pop t={t} from={at(s, 'one')}><Label>148 tiles</Label></Pop></Abs>
      <Abs x={CX} y={630} z={50}><Pop t={t} from={at(s, 'washing')}><Label size={38} color="#f2c14e">“Washing the tiles”</Label></Pop></Abs>
    </Felt>
  );
}

/* ---------- Scene 2: one wall, two high (seen from the front) ---------- */
function Build({ s, t }: { s: SceneData; t: number }) {
  const tRow = at(s, 'line');
  const tStack = at(s, 'stack');
  const tTwo = at(s, 'two');
  const n = 9;
  const w = 60;
  const h = w * 0.62;
  const x0 = CX - (n * (w + 4)) / 2 + w / 2;
  const yBase = 400;
  return (
    <Felt>
      <Abs x={CX} y={110}><Pop t={t} from={0.2}><Label size={38}>Each player builds a wall</Label></Pop></Abs>
      {Array.from({ length: n }, (_, i) => {
        const k = ease(t, tRow + i * 0.12, 0.35);
        return (
          <Abs key={`b${i}`} x={lerp(-80, x0 + i * (w + 4), k)} y={yBase}>
            <Layer w={w} h={h} />
          </Abs>
        );
      })}
      {Array.from({ length: n }, (_, i) => {
        const k = ease(t, tStack + i * 0.1, 0.35);
        return (
          <Abs key={`t${i}`} x={x0 + i * (w + 4)} y={lerp(yBase - h - 160, yBase - h + 1, k)}>
            <div style={{ opacity: clamp(k * 3) }}><Layer w={w} h={h} /></div>
          </Abs>
        );
      })}
      <Abs x={CX} y={560}>
        <Pop t={t} from={tTwo}>
          <div className="flex items-center gap-4">
            <StackSide w={44} />
            <Label size={52} color="#f2c14e">Two tiles high</Label>
          </div>
        </Pop>
      </Abs>
    </Felt>
  );
}
function Layer({ w, h }: { w: number; h: number }) {
  return (
    <div
      style={{
        width: w, height: h, borderRadius: 6,
        background: 'linear-gradient(to bottom, #3f8a63 0 34%, #F3E9D3 34% 100%)',
        border: '1px solid #b9a27a', boxShadow: '0 3px 4px rgba(0,0,0,0.35)',
      }}
    />
  );
}

/* ---------- The square, seen from above ---------- */
export type Side = 'bottom' | 'right' | 'top' | 'left';
export const SIDES: { side: Side; seat: number; name: string; tile: number; n: number }[] = [
  { side: 'bottom', seat: 0, name: 'East', tile: E, n: 19 },
  { side: 'right', seat: 1, name: 'South', tile: S, n: 18 },
  { side: 'top', seat: 2, name: 'West', tile: Wn, n: 19 },
  { side: 'left', seat: 3, name: 'North', tile: N, n: 18 },
];
export const STACK = 23; // px per stack along a wall
export const HALF = 236; // centre to each wall

export function SquareWalls({ spread = 0, lit, glow = 0, labels, split }: {
  /** 0 = pushed together, 1 = walls far apart. */
  spread?: number;
  /** Stacks lit per side (count from that player's right). */
  lit?: Record<Side, number>;
  glow?: number;
  labels?: Partial<Record<Side, number>>;
  /** Break the wall on `side` after `after` stacks (counted from the owner's right); `open` 0→1 widens the gap. */
  split?: { side: Side; after: number; open: number };
}) {
  return (
    <>
      <div
        className="absolute rounded-xl"
        style={{
          left: CX - HALF - 14, top: CY - HALF - 14, width: (HALF + 14) * 2, height: (HALF + 14) * 2,
          boxShadow: `0 0 ${40 * glow}px ${12 * glow}px rgba(242,193,78,${0.5 * glow})`, opacity: glow,
        }}
      />
      {SIDES.map(({ side, n }) => {
        const off = HALF + spread * 150;
        const horizontal = side === 'bottom' || side === 'top';
        const x = side === 'left' ? CX - off : side === 'right' ? CX + off : CX;
        const y = side === 'top' ? CY - off : side === 'bottom' ? CY + off : CY;
        return (
          <Abs key={side} x={x} y={y}>
            <div className={`flex ${horizontal ? 'flex-row' : 'flex-col'}`} style={{ gap: 1, opacity: 1 - spread * 0.4 }}>
              {Array.from({ length: n }, (_, i) => {
                // Number stacks from the owner's right-hand end.
                const fromRight = side === 'bottom' ? n - 1 - i : side === 'top' ? i : side === 'right' ? n - 1 - i : i;
                const on = (lit?.[side] ?? 0) > fromRight;
                const shift = split && split.side === side && fromRight >= split.after ? split.open * 16 : 0;
                const dir = side === 'bottom' || side === 'right' ? -1 : 1;
                return (
                  <div
                    key={i}
                    style={{
                      transform: horizontal ? `translateX(${dir * shift}px)` : `translateY(${dir * shift}px)`,
                      width: horizontal ? STACK - 1 : 24, height: horizontal ? 24 : STACK - 1, borderRadius: 3,
                      background: on ? 'linear-gradient(160deg, #f6d77a, #e0a93a)' : 'linear-gradient(160deg, #3f8a63, #2a6145)',
                      boxShadow: '0 0 0 1px #EADBB9, 0 2px 3px rgba(0,0,0,0.4)',
                    }}
                  />
                );
              })}
            </div>
          </Abs>
        );
      })}
      {labels && SIDES.map(({ side, name, tile, n }) => {
        const k = labels[side];
        if (k === undefined) return null;
        const d = HALF - 92;
        const x = side === 'left' ? CX - d : side === 'right' ? CX + d : CX;
        const y = side === 'top' ? CY - d : side === 'bottom' ? CY + d : CY;
        return (
          <Abs key={`l${side}`} x={x} y={y}>
            <div className="flex flex-col items-center gap-1.5" style={{ opacity: k, transform: `scale(${0.85 + 0.15 * k})` }}>
              <Tile index={tile} w={46} />
              <div className="font-display font-bold text-[28px] text-[#f2f0ea] whitespace-nowrap">{name} · <span className="text-[#f2c14e]">{n}</span></div>
            </div>
          </Abs>
        );
      })}
    </>
  );
}

/* ---------- Scene 3: push together ---------- */
function Push({ s, t }: { s: SceneData; t: number }) {
  const k = ease(t, at(s, 'push'), 1.3);
  return (
    <Felt>
      <SquareWalls spread={1 - k} glow={ease(t, at(s, 'every'), 0.6)} />
      <Abs x={CX} y={CY}><Pop t={t} from={at(s, 'square')}><Label size={40}>The wall</Label></Pop></Abs>
    </Felt>
  );
}

/* ---------- Scene 4: 19, 18, 19, 18 ---------- */
function Lengths({ s, t }: { s: SceneData; t: number }) {
  const tE = at(s, 'east');
  const tW = at(s, 'west');
  const tSN = at(s, 'south');
  const count = (from: number, n: number) => Math.round(clamp((t - from) / 1.1) * n);
  return (
    <Felt>
      <SquareWalls
        lit={{ bottom: count(tE, 19), top: count(tW, 19), right: count(tSN, 18), left: count(tSN + 0.4, 18) }}
        labels={{ bottom: ease(t, tE), top: ease(t, tW), right: ease(t, tSN), left: ease(t, tSN + 0.4) }}
      />
    </Felt>
  );
}

/* ---------- Scene 5: why ---------- */
function Why({ s, t }: { s: SceneData; t: number }) {
  const rows: { from: number; body: ReactNode }[] = [
    { from: at(s, 'one'), body: <>148 tiles</> },
    { from: at(s, 'seventy', 0), body: <>÷ 2 = <span className="text-[#f2c14e]">74 stacks</span></> },
    { from: at(s, 'seventy', 1), body: <>74 ÷ 4 = 18½ <span className="text-[#ef6b5a]">✗</span></> },
    { from: at(s, 'two'), body: <><span className="text-[#f2c14e]">19</span> + 18 + <span className="text-[#f2c14e]">19</span> + 18 = 74 <span className="text-[#3ccf8e]">✓</span></> },
  ];
  return (
    <Felt>
      <div className="absolute inset-x-0 top-[120px] flex flex-col items-center gap-9">
        {rows.map((r, i) => (
          <Pop key={i} t={t} from={r.from}><Label size={i === 3 ? 50 : 56}>{r.body}</Label></Pop>
        ))}
      </div>
      <Abs x={CX} y={610}>
        <Pop t={t} from={at(s, 'extra')}>
          <div className="text-[30px] text-[#f2f0ea]/85 font-semibold whitespace-nowrap">East and West get the extra stack</div>
        </Pop>
      </Abs>
    </Felt>
  );
}

/* ---------- Scene 6: recap ---------- */
function Recap({ s, t }: { s: SceneData; t: number }) {
  const items = [
    { from: at(s, 'tiles'), text: 'Tiles face down' },
    { from: at(s, 'walls'), text: 'Walls two high' },
    { from: at(s, 'nineteen'), text: '19 · 18 · 19 · 18' },
  ];
  const tNext = at(s, 'next');
  return (
    <Felt>
      <div className="absolute left-[90px] top-[90px] flex flex-col gap-8">
        {items.map((it, i) => (
          <Pop key={i} t={t} from={it.from}>
            <div className="flex items-center gap-5">
              <span className="w-14 h-14 rounded-full bg-[#3ccf8e] text-[#0c2a1d] grid place-items-center text-[34px] font-bold">✓</span>
              <span className="font-display font-bold text-[46px] text-[#f2f0ea]">{it.text}</span>
            </div>
          </Pop>
        ))}
      </div>
      <Abs x={CX} y={540}>
        <Pop t={t} from={tNext}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-5" style={{ transform: `rotate(${Math.sin((t - tNext) * 3) * 6}deg)` }}>
              <div className="scale-[2]"><DiceFace value={4} /></div>
              <div className="w-10" />
              <div className="scale-[2]"><DiceFace value={2} /></div>
            </div>
            <div className="mt-6 font-display font-bold text-[34px] text-[#f2c14e]">Next: the dice</div>
          </div>
        </Pop>
      </Abs>
    </Felt>
  );
}

export const WALL_SCENES = [Wash, Build, Push, Lengths, Why, Recap];
