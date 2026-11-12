// Explainers for "A turn" and "Claiming": draw and throw, kong, calling pung, calling chow, winning.
import type { ReactNode } from 'react';
import { tileToIndex, suit, wind, dragon } from '@mahjongkaki/engine';
import { Felt, Pop, Tile, TileBack, at, clamp, ease, lerp, type SceneData } from './kit';
import { Abs, Label } from './wall';

type V = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const b = (v: V) => tileToIndex(suit('bamboo', v));
const c = (v: V) => tileToIndex(suit('character', v));
const d = (v: V) => tileToIndex(suit('dot', v));
const N = tileToIndex(wind('north'));
const RED = tileToIndex(dragon('red'));

const CX = 328;
const POND = { x: CX, y: 300 };
const HAND_Y = 600;
const TW = 40; // hand tile width

/** Players round the table, as seen from your seat (bottom). Turns go to the right. */
const SEAT = {
  you: { x: CX, y: 690, name: 'You' },
  right: { x: 600, y: 300, name: 'Right' },
  across: { x: CX, y: 64, name: 'Across' },
  left: { x: 56, y: 300, name: 'Left' },
} as const;
type SeatKey = keyof typeof SEAT;

function SeatTag({ k, glow = 0, note }: { k: SeatKey; glow?: number; note?: ReactNode }) {
  const p = SEAT[k];
  if (k === 'you') return null;
  return (
    <Abs x={p.x} y={p.y}>
      <div className="flex flex-col items-center gap-1">
        <div className="px-3 py-1.5 rounded-full font-display font-bold text-[22px] text-[#16181b]"
          style={{ background: '#e9dfc8', boxShadow: glow ? `0 0 0 ${3 * glow}px #f2c14e, 0 0 ${20 * glow}px rgba(242,193,78,0.8)` : '0 3px 8px rgba(0,0,0,0.35)' }}>
          {p.name}
        </div>
        {note}
      </div>
    </Abs>
  );
}

/** Your hand along the bottom; `glow` lists positions to ring. */
function Hand({ tiles, glow = [], hide = [], y = HAND_Y, w = TW }: { tiles: number[]; glow?: number[]; hide?: number[]; y?: number; w?: number }) {
  return (
    <div className="absolute inset-x-0 flex justify-center gap-1" style={{ top: y }}>
      {tiles.map((t, i) => (
        <div key={i} style={{ opacity: hide.includes(i) ? 0 : 1, borderRadius: 7, boxShadow: glow.includes(i) ? '0 0 0 3px #f2c14e, 0 0 16px rgba(242,193,78,0.9)' : undefined }}>
          <Tile index={t} w={w} />
        </div>
      ))}
    </div>
  );
}
const handX = (n: number, i: number, w = TW) => CX - ((n * (w + 4)) - 4) / 2 + i * (w + 4) + w / 2;

/** A tile flying from a to b over [from, from + len]. */
function Fly({ tile, a, b: to, t, from, len = 0.6, w = TW, back = false }: { tile: number; a: { x: number; y: number }; b: { x: number; y: number }; t: number; from: number; len?: number; w?: number; back?: boolean }) {
  if (t < from) return null;
  const k = ease(t, from, len);
  return (
    <Abs x={lerp(a.x, to.x, k)} y={lerp(a.y, to.y, k)} z={9}>
      {back && k < 0.5 ? <TileBack w={w} /> : <Tile index={tile} w={w} />}
    </Abs>
  );
}

function Call({ t, from, text }: { t: number; from: number; text: string }) {
  const k = ease(t, from, 0.25);
  if (k <= 0) return null;
  return (
    <Abs x={CX} y={470} z={10}>
      <div className="px-6 py-2 rounded-2xl bg-[#f2c14e] text-[#16181b] font-display font-extrabold text-[44px]" style={{ transform: `scale(${0.6 + 0.4 * k})`, opacity: k, boxShadow: '0 10px 24px rgba(0,0,0,0.45)' }}>{text}</div>
    </Abs>
  );
}

function Note({ t, from, children, y = 40, color }: { t: number; from: number; children: ReactNode; y?: number; color?: string }) {
  return <Abs x={CX} y={y} z={8}><Pop t={t} from={from}><Label size={32} color={color}>{children}</Label></Pop></Abs>;
}

function WallStrip({ n = 9, glowLast = false, y = 120 }: { n?: number; glowLast?: boolean; y?: number }) {
  return (
    <Abs x={CX} y={y}>
      <div className="flex gap-1">
        {Array.from({ length: n }, (_, i) => (
          <div key={i} style={{ borderRadius: 7, boxShadow: glowLast && i === n - 1 ? '0 0 0 3px #f2c14e, 0 0 14px rgba(242,193,78,0.9)' : undefined }}><TileBack w={34} /></div>
        ))}
      </div>
    </Abs>
  );
}

function Checklist({ t, items }: { t: number; items: { from: number; text: string }[] }) {
  return (
    <div className="absolute left-[60px] top-[150px] flex flex-col gap-9">
      {items.map((it, i) => (
        <Pop key={i} t={t} from={it.from}>
          <div className="flex items-center gap-5">
            <span className="w-14 h-14 shrink-0 rounded-full bg-[#3ccf8e] text-[#0c2a1d] grid place-items-center text-[34px] font-bold">✓</span>
            <span className="font-display font-bold text-[40px] leading-tight text-[#f2f0ea]">{it.text}</span>
          </div>
        </Pop>
      ))}
    </div>
  );
}

/* =================== Draw and throw =================== */

const HAND13 = [c(2), c(3), c(4), c(7), c(8), d(5), d(5), d(5), b(2), b(2), b(6), b(7), N];
const DRAWN = b(8);

function Count({ n, t, from }: { n: number; t: number; from: number }) {
  return <Abs x={CX} y={HAND_Y - 50}><Pop t={t} from={from}><Label size={40} color="#f2c14e">{n} tiles</Label></Pop></Abs>;
}

const DT1 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><WallStrip /><Hand tiles={HAND13} /><Count n={13} t={t} from={at(s, 'thirteen')} /></Felt>
);
function DT2({ s, t }: { s: SceneData; t: number }) {
  const tTake = at(s, 'take');
  const landed = t >= tTake + 0.7;
  const hand = landed ? [...HAND13, DRAWN] : HAND13;
  return (
    <Felt>
      <WallStrip n={landed ? 8 : 9} glowLast={!landed} />
      <Hand tiles={hand} glow={landed ? [13] : []} />
      {!landed && <Fly tile={DRAWN} a={{ x: CX + 4 * 38, y: 120 }} b={{ x: handX(14, 13), y: HAND_Y + 28 }} t={t} from={tTake} len={0.7} back />}
      <Count n={14} t={t} from={at(s, 'fourteen')} />
    </Felt>
  );
}
function DT3({ s, t }: { s: SceneData; t: number }) {
  const tThrow = at(s, 'throw');
  const hand = [...HAND13.slice(0, 12), DRAWN, N]; // N is last
  const gone = t >= tThrow;
  return (
    <Felt>
      <WallStrip n={8} />
      <Hand tiles={gone ? hand.slice(0, 13) : hand} />
      <Fly tile={N} a={{ x: handX(14, 13), y: HAND_Y + 28 }} b={POND} t={t} from={tThrow} len={0.7} w={52} />
      <Count n={13} t={t} from={at(s, 'thirteen')} />
    </Felt>
  );
}
function DT4({ s, t }: { s: SceneData; t: number }) {
  const lonely = ease(t, at(s, 'lonely'), 0.3);
  return (
    <Felt>
      <WallStrip n={8} />
      <Hand tiles={[...HAND13.slice(0, 12), DRAWN]} />
      <Abs x={POND.x} y={POND.y}>
        <div style={{ borderRadius: 9, boxShadow: lonely ? `0 0 0 ${4 * lonely}px #f2c14e, 0 0 ${24 * lonely}px rgba(242,193,78,0.9)` : undefined }}><Tile index={N} w={52} /></div>
      </Abs>
      <Note t={t} from={at(s, 'lonely')} y={410} color="#f2c14e">No partner, so throw it</Note>
    </Felt>
  );
}
function DT5({ s, t }: { s: SceneData; t: number }) {
  const k = ease(t, at(s, 'right'), 0.6);
  return (
    <Felt>
      <SeatTag k="right" glow={k} />
      <SeatTag k="across" /><SeatTag k="left" />
      <Abs x={POND.x} y={POND.y}><Tile index={N} w={52} /></Abs>
      <Hand tiles={[...HAND13.slice(0, 12), DRAWN]} />
      <Abs x={lerp(CX + 60, 520, k)} y={lerp(560, 360, k)}><div style={{ opacity: k }}><Label size={60} color="#f2c14e">↗</Label></div></Abs>
      <Note t={t} from={at(s, 'draw')} y={420}>Draw one, throw one</Note>
    </Felt>
  );
}
export const DRAW_THROW_SCENES = [DT1, DT2, DT3, DT4, DT5];

/* =================== Kong =================== */

const KONG = [d(8), d(8), d(8), d(8)];
const KHAND = [c(1), c(2), c(3), b(4), b(5), b(6), d(8), d(8), d(8), d(8), RED, RED, b(9)];

function K1({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      <div className="absolute inset-x-0 top-[200px] flex justify-center gap-2">
        {KONG.map((tile, i) => {
          const k = ease(t, at(s, 'four') + i * 0.15, 0.3);
          return <div key={i} style={{ opacity: k, transform: `translateY(${(1 - k) * -24}px)` }}><Tile index={tile} w={92} /></div>;
        })}
      </div>
      <Note t={t} from={at(s, 'kong')} y={430} color="#f2c14e">A kong</Note>
    </Felt>
  );
}
function K2({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      <Hand tiles={KHAND} glow={[6, 7, 8, 9]} y={260} />
      <Note t={t} from={at(s, 'set')} y={140}>4 tiles, but only 1 set</Note>
      <Note t={t} from={at(s, 'short')} y={420} color="#f2c14e">One tile short</Note>
    </Felt>
  );
}
function K3({ s, t }: { s: SceneData; t: number }) {
  const tLay = 0.3;
  const tExtra = at(s, 'extra');
  const laid = ease(t, tLay, 0.6);
  const got = t >= tExtra + 0.7;
  const rest = [c(1), c(2), c(3), b(4), b(5), b(6), RED, RED, b(9)];
  return (
    <Felt>
      <WallStrip glowLast={!got && t >= tExtra - 0.2} />
      <Abs x={CX} y={lerp(HAND_Y, 400, laid)}>
        <div className="flex gap-1">{KONG.map((tile, i) => <Tile key={i} index={tile} w={44} />)}</div>
      </Abs>
      <Hand tiles={got ? [...rest, c(9)] : rest} glow={got ? [9] : []} />
      {!got && <Fly tile={c(9)} a={{ x: CX + 4 * 38, y: 120 }} b={{ x: handX(10, 9), y: HAND_Y + 28 }} t={t} from={tExtra} len={0.7} back />}
      <Note t={t} from={at(s, 'back')} y={210} color="#f2c14e">Replacement from the back</Note>
    </Felt>
  );
}
function K4({ s, t }: { s: SceneData; t: number }) {
  const rest = [c(1), c(2), c(3), b(4), b(5), b(6), RED, RED, b(9), c(9)];
  const thrown = t >= at(s, 'throw');
  return (
    <Felt>
      <Abs x={CX} y={400}><div className="flex gap-1">{KONG.map((tile, i) => <Tile key={i} index={tile} w={44} />)}</div></Abs>
      <Hand tiles={thrown ? rest.slice(0, 9) : rest} />
      <Fly tile={c(9)} a={{ x: handX(10, 9), y: HAND_Y + 28 }} b={POND} t={t} from={at(s, 'throw')} w={52} />
    </Felt>
  );
}
const K5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Checklist t={t} items={[
    { from: at(s, 'four'), text: 'Four the same' },
    { from: at(s, 'lay'), text: 'Lay it down' },
    { from: at(s, 'replacement'), text: 'Draw a replacement' },
  ]} /></Felt>
);
export const KONG_SCENES = [K1, K2, K3, K4, K5];

/* =================== Calling pung =================== */

const PHAND = [RED, RED, c(3), c(4), c(5), d(2), d(2), b(6), b(7), b(8), d(9), N, N];

function PC1({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      <SeatTag k="across" glow={t < at(s, 'two') ? 1 : 0} /><SeatTag k="left" /><SeatTag k="right" />
      <Fly tile={RED} a={{ x: SEAT.across.x, y: SEAT.across.y + 40 }} b={POND} t={t} from={at(s, 'throws')} w={56} />
      <Hand tiles={PHAND} glow={t >= at(s, 'two') ? [0, 1] : []} />
      <Call t={t} from={at(s, 'pung')} text="Pung!" />
    </Felt>
  );
}
function PC2({ s, t }: { s: SceneData; t: number }) {
  const k = ease(t, at(s, 'lay'), 0.7);
  return (
    <Felt>
      <SeatTag k="across" /><SeatTag k="left" /><SeatTag k="right" />
      <Abs x={lerp(POND.x, CX - 50, ease(t, at(s, 'take'), 0.6))} y={lerp(POND.y, 470, ease(t, at(s, 'take'), 0.6))}><Tile index={RED} w={48} /></Abs>
      <Abs x={CX + 8} y={470}><div className="flex gap-1" style={{ opacity: k }}><Tile index={RED} w={48} /><Tile index={RED} w={48} /></div></Abs>
      <Hand tiles={PHAND} hide={k > 0 ? [0, 1] : []} />
      <Note t={t} from={at(s, 'face')} y={390} color="#f2c14e">Laid out face up</Note>
    </Felt>
  );
}
function PC3({ s, t }: { s: SceneData; t: number }) {
  const tA = at(s, 'anyone');
  return (
    <Felt>
      {(['left', 'across', 'right'] as SeatKey[]).map((k, i) => (
        <SeatTag key={k} k={k} glow={ease(t, tA + i * 0.3, 0.3)} note={<Pop t={t} from={tA + i * 0.3}><span className="text-[#3ccf8e] text-[30px] font-bold">✓</span></Pop>} />
      ))}
      <Hand tiles={PHAND.slice(2)} />
      <Note t={t} from={tA} y={300}>Pung from anyone</Note>
    </Felt>
  );
}
function PC4({ s, t }: { s: SceneData; t: number }) {
  const tSkip = at(s, 'skipped');
  return (
    <Felt>
      <SeatTag k="across" note={<Pop t={t} from={tSkip}><span className="text-[#ef6b5a] text-[24px] font-bold">skipped</span></Pop>} />
      <SeatTag k="left" note={<Pop t={t} from={tSkip}><span className="text-[#ef6b5a] text-[24px] font-bold">skipped</span></Pop>} />
      <SeatTag k="right" glow={ease(t, at(s, 'carries'), 0.4)} note={<Pop t={t} from={at(s, 'carries')}><span className="text-[#f2c14e] text-[24px] font-bold">next</span></Pop>} />
      <Abs x={CX} y={470}><div className="flex gap-1">{[RED, RED, RED].map((x, i) => <Tile key={i} index={x} w={44} />)}</div></Abs>
      <Fly tile={N} a={{ x: handX(11, 10), y: HAND_Y + 28 }} b={POND} t={t} from={at(s, 'throw')} w={52} />
      <Hand tiles={t >= at(s, 'throw') ? PHAND.slice(2, 12) : PHAND.slice(2)} />
    </Felt>
  );
}
const PC5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Checklist t={t} items={[
    { from: at(s, 'hold'), text: 'You hold two' },
    { from: at(s, 'throws'), text: 'Anyone throws the third' },
    { from: at(s, 'call'), text: 'Call “pung”' },
  ]} /></Felt>
);
export const PUNG_CLAIM_SCENES = [PC1, PC2, PC3, PC4, PC5];

/* =================== Calling chow =================== */

const CHAND = [d(4), d(6), c(1), c(1), c(1), b(2), b(3), b(4), RED, RED, c(8), c(9), N];

function CC1({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      <SeatTag k="left" glow={1} /><SeatTag k="across" /><SeatTag k="right" />
      <Fly tile={d(5)} a={{ x: SEAT.left.x + 40, y: SEAT.left.y }} b={POND} t={t} from={0.2} w={56} />
      <Hand tiles={CHAND} glow={t >= at(s, 'finish') ? [0, 1] : []} />
      <Call t={t} from={at(s, 'chow')} text="Chow!" />
    </Felt>
  );
}
function CC2({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      <SeatTag k="left" glow={ease(t, at(s, 'left'), 0.3)} note={<Pop t={t} from={at(s, 'left')}><span className="text-[#f2c14e] text-[22px] font-bold">just before you</span></Pop>} />
      <SeatTag k="across" /><SeatTag k="right" />
      <Abs x={CX} y={470}><div className="flex gap-1">{[d(4), d(5), d(6)].map((x, i) => <Tile key={i} index={x} w={46} />)}</div></Abs>
      <Hand tiles={CHAND.slice(2)} />
      <Note t={t} from={at(s, 'only')} y={300}>Chow only from your left</Note>
    </Felt>
  );
}
function CC3({ s, t }: { s: SceneData; t: number }) {
  const tGo = at(s, 'go');
  const x = ease(t, tGo, 0.3);
  return (
    <Felt>
      <SeatTag k="across" glow={1} /><SeatTag k="left" /><SeatTag k="right" />
      <Fly tile={d(5)} a={{ x: SEAT.across.x, y: SEAT.across.y + 40 }} b={POND} t={t} from={at(s, 'anyone')} w={56} />
      {x > 0 && <Abs x={POND.x} y={POND.y} z={10}><span className="w-16 h-16 rounded-full bg-[#ef6b5a] text-white grid place-items-center text-[40px] font-bold" style={{ opacity: x }}>✗</span></Abs>}
      <Hand tiles={CHAND} />
      <Note t={t} from={tGo} y={420} color="#f2c14e">Let it go</Note>
    </Felt>
  );
}
const CC4 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt>
    <div className="absolute inset-x-0 top-[170px] flex flex-col items-center gap-10">
      <Pop t={t} from={at(s, 'pung')}><Label size={52}>Pung <span className="text-[#f2c14e]">beats</span> chow</Label></Pop>
      <Pop t={t} from={at(s, 'winning')}><Label size={52}>A win <span className="text-[#f2c14e]">beats</span> both</Label></Pop>
    </div>
  </Felt>
);
const CC5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Checklist t={t} items={[
    { from: at(s, 'chow'), text: 'Chow: only from your left' },
    { from: at(s, 'pung'), text: 'Pung wins a tie' },
  ]} /></Felt>
);
export const CHOW_CLAIM_SCENES = [CC1, CC2, CC3, CC4, CC5];

/* =================== Winning =================== */

const WAIT = [c(1), c(2), c(3), d(6), d(6), d(6), b(4), b(5), b(6), N, N, N, RED];
const WINNER = RED;

function W1({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      <Hand tiles={[...WAIT, WINNER]} hide={[13]} y={300} w={42} />
      <Abs x={handX(14, 13, 42)} y={329}><div className="rounded-[9px] border-2 border-dashed border-[#f2c14e]" style={{ width: 42, height: 58, opacity: 0.8 }} /></Abs>
      <Note t={t} from={at(s, 'waiting')} y={430} color="#f2c14e">Waiting for a red dragon</Note>
    </Felt>
  );
}
function W2({ s, t }: { s: SceneData; t: number }) {
  const tShow = at(s, 'show');
  return (
    <Felt>
      <SeatTag k="right" glow={1} /><SeatTag k="across" /><SeatTag k="left" />
      <Fly tile={WINNER} a={{ x: SEAT.right.x - 40, y: SEAT.right.y }} b={POND} t={t} from={0.2} w={56} />
      <Call t={t} from={at(s, 'hu')} text="Hu!" />
      <Hand tiles={t >= tShow ? [...WAIT, WINNER] : WAIT} glow={t >= tShow ? [12, 13] : []} />
    </Felt>
  );
}
function W3({ s, t }: { s: SceneData; t: number }) {
  return (
    <Felt>
      <SeatTag k="right" glow={1} note={<Pop t={t} from={at(s, 'double')}><span className="text-[#f2c14e] text-[26px] font-bold">pays ×2</span></Pop>} />
      <SeatTag k="across" note={<Pop t={t} from={at(s, 'double') + 0.4}><span className="text-[#f2f0ea] text-[24px] font-bold">pays ×1</span></Pop>} />
      <SeatTag k="left" note={<Pop t={t} from={at(s, 'double') + 0.4}><span className="text-[#f2f0ea] text-[24px] font-bold">pays ×1</span></Pop>} />
      <Hand tiles={[...WAIT, WINNER]} />
      <Note t={t} from={at(s, 'threw')} y={300}>The thrower pays double</Note>
    </Felt>
  );
}
function W4({ s, t }: { s: SceneData; t: number }) {
  const tDraw = at(s, 'draw');
  const tAll = at(s, 'all');
  const got = t >= tDraw + 0.7;
  return (
    <Felt>
      <WallStrip n={7} glowLast={!got} y={200} />
      {(['left', 'across', 'right'] as SeatKey[]).map(k => (
        <SeatTag key={k} k={k} glow={ease(t, tAll, 0.3)} note={<Pop t={t} from={tAll}><span className="text-[#f2c14e] text-[26px] font-bold">pays ×2</span></Pop>} />
      ))}
      {!got && <Fly tile={WINNER} a={{ x: CX + 3 * 38, y: 200 }} b={{ x: handX(14, 13), y: HAND_Y + 28 }} t={t} from={tDraw} len={0.7} back />}
      <Hand tiles={got ? [...WAIT, WINNER] : WAIT} glow={got ? [13] : []} />
      <Note t={t} from={at(s, 'self')} y={330} color="#f2c14e">Self-drawn win</Note>
    </Felt>
  );
}
const W5 = ({ s, t }: { s: SceneData; t: number }) => (
  <Felt><Checklist t={t} items={[
    { from: at(s, 'wait'), text: 'Wait for your last tile' },
    { from: at(s, 'hu'), text: 'Call “hu”' },
  ]} /></Felt>
);
export const WINNING_SCENES = [W1, W2, W3, W4, W5];

void clamp;
