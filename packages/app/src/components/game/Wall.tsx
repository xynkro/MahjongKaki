// The wall around the table, drawn as stacks two tiles high, and the deal that starts each hand.
// Purely a picture of GameState: how many tiles are left at the front (normal draws) and the
// back (flower and kong replacements). The game logic itself never sees any of this.
import { useEffect, useState } from 'react';
import { type GameState } from '@mahjongkaki/game';
import { type Wind, WINDS } from '@mahjongkaki/engine';

const DEAD_WALL = 16; // tiles set aside at the back for replacements (see dealInitial)

export function seatWindOf(seat: number, dealerSeat: number): Wind {
  return WINDS[(seat - dealerSeat + 4) % 4];
}

export function totalTiles(state: GameState): number {
  return 136 + (state.rules.animalsEnabled ? 12 : 8);
}

/** Stacks each seat builds: with 148 tiles East and West build 19, South and North 18. */
export function stacksFor(wind: Wind, total: number): number {
  if (total === 148) return wind === 'east' || wind === 'west' ? 19 : 18;
  return total / 8;
}

/** How many tiles have gone from the front of the wall and from the back. */
export function wallUsage(state: GameState): { front: number; back: number } {
  const gone = totalTiles(state) - state.wall.length - state.deadWall.length;
  const back = Math.max(0, DEAD_WALL - state.deadWall.length);
  return { front: Math.max(0, gone - back), back };
}

export interface Dice { a: number; b: number }
export const rollDice = (): Dice => ({ a: 1 + Math.floor(Math.random() * 6), b: 1 + Math.floor(Math.random() * 6) });

/** The seat whose wall is broken: count round the table from the dealer, who counts as 1. */
export function breakSeat(dice: Dice, dealerSeat: number): number {
  return (dealerSeat + dice.a + dice.b - 1) % 4;
}

/** Tiles each seat holds after the first `dealt` tiles of the deal (4 at a time ×3, then 1 each, then 1 more to the dealer). */
export function dealtCount(dealt: number, seat: number, dealerSeat: number): number {
  const turn = (seat - dealerSeat + 4) % 4;
  let n = 0;
  for (let round = 0; round < 3; round++) {
    const start = round * 16 + turn * 4;
    n += Math.max(0, Math.min(4, dealt - start));
  }
  if (dealt > 48 + turn) n += 1;
  if (turn === 0 && dealt > 52) n += 1;
  return n;
}
export const DEAL_TOTAL = 53;

interface RingProps {
  state: GameState;
  dice: Dice;
  /** Override during the deal intro. */
  front?: number;
  back?: number;
  /** How many stacks are built so far (deal intro); undefined = all. */
  built?: number;
  /** Mark where the dice broke the wall. */
  showBreak?: boolean;
  /** Glow the next stack to draw from (your turn to draw). */
  glowNext?: boolean;
}

/** The four walls, laid out as a frame around the discard pool. Your wall is the bottom one. */
export function WallRing({ state, dice, front, back, built, showBreak, glowNext }: RingProps) {
  const hs = state.humanSeat;
  const total = totalTiles(state);
  // Clockwise on screen, each side starting at its owner's right-hand end.
  const sides = [hs, (hs + 3) % 4, (hs + 2) % 4, (hs + 1) % 4].map(seat => ({
    seat,
    count: stacksFor(seatWindOf(seat, state.dealerSeat), total),
  }));
  const starts: number[] = [];
  let len = 0;
  for (const s of sides) { starts.push(len); len += s.count; }

  const bSeat = breakSeat(dice, state.dealerSeat);
  const sideIdx = sides.findIndex(s => s.seat === bSeat);
  const brk = (starts[sideIdx] + Math.min(dice.a + dice.b, sides[sideIdx].count)) % len;

  const usage = wallUsage(state);
  const f = front ?? usage.front;
  const bk = back ?? usage.back;

  // Tiles still standing in each stack (0, 1 or 2), indexed clockwise.
  const left = new Array<number>(len).fill(2);
  for (let k = 0; 2 * k < f; k++) left[(brk + k) % len] -= Math.min(2, f - 2 * k);
  for (let k = 0; 2 * k < bk; k++) left[(brk - 1 - k + len * 2) % len] -= Math.min(2, bk - 2 * k);
  const next = (brk + Math.floor(f / 2)) % len;

  const stack = (i: number, side: 'top' | 'bottom' | 'left' | 'right') => {
    const horizontal = side === 'top' || side === 'bottom';
    const n = Math.max(0, left[i]);
    const shown = built === undefined || i < built;
    const isNext = glowNext && i === next;
    const atBreak = showBreak && (i === brk || i === (brk - 1 + len) % len);
    return (
      <div
        key={i}
        className={`flex-1 rounded-[2px] transition-all duration-300 ${isNext ? 'wall-next' : ''}`}
        style={{
          opacity: shown ? (n === 0 ? 0 : 1) : 0,
          transform: shown ? 'none' : 'scale(0.4)',
          margin: atBreak ? (horizontal ? '0 4px' : '4px 0') : undefined,
          // Seen from above at a slight angle: the green back on top, the ivory edge below.
          background: `linear-gradient(${side === 'top' ? 'to bottom' : side === 'bottom' ? 'to top' : side === 'left' ? 'to right' : 'to left'}, #F3E9D3 0 38%, #2f6b4b 38% 100%)`,
          boxShadow: '0 1px 1.5px rgba(0,0,0,0.45)',
          outline: n === 1 ? '1px dashed rgba(243,233,211,0.35)' : undefined,
          [horizontal ? 'height' : 'width']: n === 2 ? '100%' : '62%',
        }}
      />
    );
  };

  const range = (s: number, c: number) => Array.from({ length: c }, (_, k) => s + k);
  const [bottom, leftSide, top, right] = sides.map((s, i) => range(starts[i], s.count));

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute left-3.5 right-3.5 top-0 h-2.5 flex items-end gap-px">{top.map(i => stack(i, 'top'))}</div>
      <div className="absolute right-0 top-3.5 bottom-3.5 w-2.5 flex flex-col items-start gap-px">{right.map(i => stack(i, 'right'))}</div>
      <div className="absolute left-3.5 right-3.5 bottom-0 h-2.5 flex items-start gap-px">{[...bottom].reverse().map(i => stack(i, 'bottom'))}</div>
      <div className="absolute left-0 top-3.5 bottom-3.5 w-2.5 flex flex-col items-end gap-px">{[...leftSide].reverse().map(i => stack(i, 'left'))}</div>
    </div>
  );
}

export type DealStep = 'build' | 'dice' | 'deal' | 'flowers';

/** Drives the deal intro: builds the wall, rolls, breaks it, then deals tile by tile. */
export function useDealIntro(active: boolean, state: GameState, hasFlowers: boolean) {
  const steps: DealStep[] = hasFlowers ? ['build', 'dice', 'deal', 'flowers'] : ['build', 'dice', 'deal'];
  const [i, setI] = useState(0);
  const [built, setBuilt] = useState(0);
  const [dealt, setDealt] = useState(0);
  const step = steps[i];
  const ringLen = totalTiles(state) / 2;

  useEffect(() => {
    if (!active) return;
    if (step === 'build' && built < ringLen) {
      const id = setTimeout(() => setBuilt(b => Math.min(ringLen, b + 3)), 30);
      return () => clearTimeout(id);
    }
    if (step === 'deal' && dealt < DEAL_TOTAL) {
      // Chunks of 4 during the first three rounds, then single tiles.
      const id = setTimeout(() => setDealt(d => (d < 48 ? d + 4 : d + 1)), d0(dealt));
      return () => clearTimeout(id);
    }
  }, [active, step, built, dealt, ringLen]);

  return {
    step,
    built: step === 'build' ? built : undefined,
    dealt: step === 'build' || step === 'dice' ? 0 : step === 'deal' ? dealt : DEAL_TOTAL,
    ready: (step === 'build' && built >= ringLen) || step === 'dice' || (step === 'deal' && dealt >= DEAL_TOTAL) || step === 'flowers',
    last: i === steps.length - 1,
    next: () => setI(n => Math.min(steps.length - 1, n + 1)),
  };
}
const d0 = (dealt: number) => (dealt < 48 ? 260 : 200);

export function DiceFace({ value }: { value: number }) {
  const pips: Record<number, [number, number][]> = {
    1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[25, 25], [50, 50], [75, 75]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
    6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
  };
  return (
    <svg viewBox="0 0 100 100" className="w-10 h-10 anim-dice">
      <rect x="4" y="4" width="92" height="92" rx="18" fill="#FBF4E4" stroke="#C6AE84" strokeWidth="3" />
      {pips[value].map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r="9" fill={value === 1 || value === 4 ? '#b5392a' : '#26201a'} />
      ))}
    </svg>
  );
}
