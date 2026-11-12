// The four walls as one ring of 74 stacks, seen from above, for the dice / deal / drawing explainers.
// Ring order: West's wall (top) from West's right-hand end, then South's (right), East's (bottom), North's (left),
// each starting at its owner's right-hand end, so dealing runs forward through the ring and replacements backward.
import { HALF, STACK } from './wall';

const CX = 328;
const CY = 350;
export const RING = [
  { side: 'top', n: 19 }, { side: 'right', n: 18 }, { side: 'bottom', n: 19 }, { side: 'left', n: 18 },
] as const;
export const RING_LEN = 74;

/** Screen position (centre) of ring stack i. */
export function stackPos(i: number): { x: number; y: number; horizontal: boolean } {
  let k = ((i % RING_LEN) + RING_LEN) % RING_LEN;
  for (const { side, n } of RING) {
    if (k < n) {
      const along = (k - (n - 1) / 2) * STACK;
      if (side === 'top') return { x: CX + along, y: CY - HALF, horizontal: true };
      if (side === 'right') return { x: CX + HALF, y: CY + along, horizontal: false };
      if (side === 'bottom') return { x: CX - along, y: CY + HALF, horizontal: true };
      return { x: CX - HALF, y: CY - along, horizontal: false };
    }
    k -= n;
  }
  throw new Error('unreachable');
}

export function Ring({ gap, open = 0, front = 0, back = 0, lit, next }: {
  /** Ring index where the wall is split (the deal starts at this stack). */
  gap?: number;
  open?: number;
  /** Tiles taken from the front (from `gap` forward) and from the back (from `gap - 1` backward). */
  front?: number;
  back?: number;
  lit?: (i: number) => boolean;
  /** Stack to glow as the next draw. */
  next?: number;
}) {
  const left = new Array<number>(RING_LEN).fill(2);
  if (gap !== undefined) {
    for (let k = 0; 2 * k < front; k++) left[(gap + k) % RING_LEN] -= Math.min(2, front - 2 * k);
    for (let k = 0; 2 * k < back; k++) left[(gap - 1 - k + RING_LEN * 2) % RING_LEN] -= Math.min(2, back - 2 * k);
  }
  return (
    <>
      {Array.from({ length: RING_LEN }, (_, i) => {
        const p = stackPos(i);
        // Push the stacks after the gap along a little to open it.
        let dx = 0, dy = 0;
        if (gap !== undefined && open > 0) {
          const after = (i - gap + RING_LEN) % RING_LEN < RING_LEN / 2;
          const q = stackPos(gap);
          const r = stackPos(gap - 1);
          const ux = Math.sign(q.x - r.x), uy = Math.sign(q.y - r.y);
          const near = Math.min((i - gap + RING_LEN) % RING_LEN, (gap - 1 - i + RING_LEN) % RING_LEN);
          if (near < 6) { const m = open * 9 * (after ? 1 : -1); dx = ux * m; dy = uy * m; }
        }
        const n = Math.max(0, left[i]);
        const on = lit?.(i);
        const glow = next === i;
        return (
          <div
            key={i}
            className="absolute rounded-[3px]"
            style={{
              left: p.x + dx, top: p.y + dy, transform: 'translate(-50%, -50%)',
              width: p.horizontal ? STACK - 1 : 24, height: p.horizontal ? 24 : STACK - 1,
              opacity: n === 0 ? 0.08 : 1,
              background: on ? 'linear-gradient(160deg, #f6d77a, #e0a93a)' : n === 1 ? 'linear-gradient(160deg, #2f6b4b, #24543b)' : 'linear-gradient(160deg, #3f8a63, #2a6145)',
              boxShadow: glow ? '0 0 0 2px #f2c14e, 0 0 14px rgba(242,193,78,0.9)' : n === 1 ? '0 0 0 1px rgba(234,219,185,0.5)' : '0 0 0 1px #EADBB9, 0 2px 3px rgba(0,0,0,0.4)',
            }}
          />
        );
      })}
    </>
  );
}

/** Where a seat's hand sits, just inside its wall. Seats: 0 East (bottom), 1 South (right), 2 West (top), 3 North (left). */
export function seatSpot(seat: number, inset = 92) {
  const d = HALF - inset;
  return [
    { x: CX, y: CY + d }, { x: CX + d, y: CY }, { x: CX, y: CY - d }, { x: CX - d, y: CY },
  ][seat];
}
