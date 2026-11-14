// The table in perspective: walls stacked two high, the other players' hands standing up with
// their backs to you, everyone's flowers, shown sets and throws face up in front of them.
// Plain CSS 3D (no WebGL, no animation loop). The scene is drawn at a fixed size in "table
// units" and scaled to fit whatever space the board gives it, portrait or landscape.
import { useLayoutEffect, useRef, useState, memo, type CSSProperties, type ReactNode } from 'react';
import { type GameState } from '@mahjongkaki/game';
import { tileToIndex, type BonusTile, type Wind, WINDS } from '@mahjongkaki/engine';
import { TileFace } from './TileFace';
import { tileName } from '../../lib/coach';
import { AnimalArt, FlowerArt } from '../BonusArt';
import { wallLayout, type Dice, DiceFace } from './Wall';

const H = 790;

const IVORY = 'linear-gradient(to bottom, #FBF4E4 0%, #F1E7D2 55%, #E4D2AC 100%)';
const BACK = 'linear-gradient(to bottom, #2f7a54, #1f5a3d)';
const BACK_TOP = '#2a6e4c';
const EDGE = '#E9DCC0';
const WIND_CHARS: Record<Wind, string> = { east: '東', south: '南', west: '西', north: '北' };
const WIND_EN: Record<Wind, string> = { east: 'East', south: 'South', west: 'West', north: 'North' };

type Side = 'bottom' | 'left' | 'top' | 'right';

/** A box standing on the felt: footprint x,y,w,d (table units), height h. Only faces a viewer
 *  in front of the table can see are drawn: the top, the near (south) side, and the inward
 *  side for boxes on the left or right. */
function Box({ x, y, w, d, h, top, south, east, west, topCls, children }: {
  x: number; y: number; w: number; d: number; h: number;
  top: string; south?: string; east?: string; west?: string; topCls?: string; children?: ReactNode;
}) {
  const face: CSSProperties = { position: 'absolute', backfaceVisibility: 'hidden' };
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: d, transformStyle: 'preserve-3d' }}>
      <div className={topCls} style={{ ...face, inset: 0, background: top || undefined, transform: `translateZ(${h}px)`, borderRadius: 2 }}>{children}</div>
      {south && <div style={{ ...face, left: 0, top: d - h, width: w, height: h, background: south, transformOrigin: 'bottom', transform: 'rotateX(-90deg)' }} />}
      {east && <div style={{ ...face, left: w - h, top: 0, width: h, height: d, background: east, transformOrigin: 'right', transform: 'rotateY(90deg)' }} />}
      {west && <div style={{ ...face, left: 0, top: 0, width: h, height: d, background: west, transformOrigin: 'left', transform: 'rotateY(-90deg)' }} />}
    </div>
  );
}

/** A tile lying face up on the felt. */
function FlatTile({ x, y, w, children, ring }: { x: number; y: number; w: number; children: ReactNode; ring?: boolean }) {
  const d = Math.round(w * 1.36);
  return (
    <Box
      x={x} y={y} w={w} d={d} h={6}
      top={IVORY}
      south={`linear-gradient(to bottom, ${EDGE} 0 55%, ${BACK_TOP} 55%)`}
      topCls={`overflow-hidden border border-[#C6AE84] ${ring ? 'ring-[3px] ring-amber-400 table-last' : ''}`}
    >
      <div className="w-full h-full flex items-center justify-center p-[1px]">{children}</div>
    </Box>
  );
}

function bonusArt(b: BonusTile) {
  if (b.kind === 'animal') return <AnimalArt animal={b.animal} className="w-full h-full" />;
  if (b.kind === 'flower') return <FlowerArt tile={{ kind: 'flower', name: b.flower }} className="w-full h-full" />;
  return <FlowerArt tile={{ kind: 'season', name: b.season }} className="w-full h-full" />;
}

function seatWind(seat: number, dealer: number): Wind { return WINDS[(seat - dealer + 4) % 4]; }

// --- Geometry (table units) ---
const P = 26;        // wall stack pitch
const SW = 23;       // stack width along the wall (the rest of the pitch is the gap between stacks)
const SD = 34;       // stack depth
const LAYER = 12;    // one tile's thickness
const GAP = 10;      // the split in the wall
const Y0 = 108, Y1 = 670, YC = (Y0 + Y1) / 2;

/** Wide (sideways phone): room beside the walls for the side players' hands and tiles.
 *  Compact (upright phone): side hands hug the walls and their shown tiles sit in the corners. */
function geometry(compact: boolean) {
  const W = compact ? 760 : 1000;
  const X0 = (W - 562) / 2, X1 = X0 + 562;
  return { W, X0, X1, XC: W / 2, compact };
}
type Geo = ReturnType<typeof geometry>;

interface TableProps {
  state: GameState;
  dice: Dice;
  front?: number;
  back?: number;
  built?: number;
  showBreak?: boolean;
  glowNext?: boolean;
  /** Tiles each seat holds right now (the deal intro shows fewer). */
  handCount: (seat: number) => number;
  seatName: (seat: number) => string;
  /** Index into discardLog of the throw to ring, or -1. */
  lastIdx: number;
  /** Deal intro on the dice step: show the dice in the middle. */
  showDice?: boolean;
  /** Upright phone: a narrower table. */
  compact?: boolean;
  /** Deal intro before the flowers step: bonus tiles haven't been laid out yet. */
  hideFlowers?: boolean;
}

export function Table3D(props: TableProps) {
  const g = geometry(Boolean(props.compact));
  const W = g.W;
  // A sideways phone has little height, so lean the table back further.
  const tilt = props.compact ? 40 : 56;
  const outer = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ s: 0.3, dx: 0, dy: 0 });

  // Scale the projected table to fill the space it has, centred.
  useLayoutEffect(() => {
    const box = outer.current;
    const pl = plane.current;
    if (!box || !pl) return;
    let cur = fit;
    const measure = () => {
      const b = box.getBoundingClientRect();
      const r = pl.getBoundingClientRect();
      if (!b.width || !r.width) return;
      // Unscaled projected size, from the current scale.
      const pw = r.width / cur.s, ph = r.height / cur.s;
      // Leave headroom: the far player's standing tiles rise above the felt's own outline.
      const s = Math.min(b.width / pw, (b.height * 0.92) / ph);
      // Where the projected centre sits relative to the box centre, at the new scale.
      const cx = (r.left + r.width / 2 - b.left - cur.dx) / cur.s;
      const cy = (r.top + r.height / 2 - b.top - cur.dy) / cur.s;
      const next = { s, dx: b.width / 2 - cx * s, dy: b.height * 0.535 - cy * s };
      if (Math.abs(next.s - cur.s) > 0.002 || Math.abs(next.dx - cur.dx) > 0.5 || Math.abs(next.dy - cur.dy) > 0.5) {
        cur = next;
        setFit(next);
      }
    };
    measure();
    const ro = new ResizeObserver(() => requestAnimationFrame(measure));
    ro.observe(box);
    return () => ro.disconnect();
  }, [props.compact]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={outer} className="relative w-full h-full overflow-hidden">
      <TableSummary {...props} />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', left: 0, top: 0, width: W, height: H,
          transformOrigin: '0 0',
          transform: `translate(${fit.dx}px, ${fit.dy}px) scale(${fit.s})`,
          perspective: '1300px',
          perspectiveOrigin: '50% 0%',
        }}
      >
        {/* The scale above is undone in measurement, so the plane's own box is all that matters. */}
        <div
          ref={plane}
          className="felt table-plane"
          style={{
            position: 'absolute', left: 0, top: 0, width: W, height: H,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt}deg)`,
            transformOrigin: '50% 100%',
            borderRadius: 28,
          }}
        >
          <Scene {...props} g={g} />
        </div>
      </div>
    </div>
  );
}

/** The same table in words, for screen readers (the 3D scene itself is decorative). */
function TableSummary({ state, seatName }: TableProps) {
  return (
    <div className="sr-only">
      <p>{WIND_EN[state.prevailingWind]} round. {state.wall.length} tiles left in the wall.</p>
      <ul>
        {[0, 1, 2, 3].map(seat => {
          const thrown = state.discardLog.filter(d => d.player === seat).map(d => tileName(d.tile));
          const sets = state.melds[seat].map(m => `${m.type} of ${tileName(tileToIndex(m.tiles[0]))}`);
          return (
            <li key={seat}>
              {seat === state.humanSeat ? 'You' : seatName(seat)}
              {seat === state.dealerSeat ? ', the dealer' : ''}
              {state.currentPlayer === seat ? ', playing now' : ''}.
              {' '}{state.hands[seat].length} tiles in hand, {state.flowers[seat].length} flowers.
              {sets.length ? ` Shown: ${sets.join(', ')}.` : ''}
              {' '}Thrown: {thrown.length ? thrown.join(', ') : 'nothing yet'}.
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const Scene = memo(function Scene({ state, dice, front, back, built, showBreak, glowNext, handCount, seatName, lastIdx, showDice, hideFlowers, g }: TableProps & { g: Geo }) {
  const { W, X0, X1, XC, compact } = g;
  const hs = state.humanSeat;
  const lay = wallLayout(state, dice, front, back);
  const sideOf: Side[] = ['bottom', 'left', 'top', 'right'];
  const seatSide = (seat: number): Side => sideOf[lay.sides.findIndex(s => s.seat === seat)];

  // --- Walls ---
  const stacks: ReactNode[] = [];
  lay.sides.forEach((side, si) => {
    const where = sideOf[si];
    const L = side.count * P;
    const brkK = lay.brk - lay.starts[si];
    const hasBreak = showBreak !== false && brkK > 0 && brkK < side.count;
    for (let k = 0; k < side.count; k++) {
      const i = lay.starts[si] + k;
      const n = Math.max(0, lay.left[i]);
      if (built !== undefined && i >= built) continue;
      if (n === 0) continue;
      const shift = hasBreak ? (k >= brkK ? GAP / 2 : -GAP / 2) : 0;
      const isNext = glowNext && i === lay.next;
      const h = n * LAYER;
      const layers = `repeating-linear-gradient(to top, ${EDGE} 0 ${LAYER * 0.55}px, ${BACK_TOP} ${LAYER * 0.55}px ${LAYER}px)`;
      const topCls = isNext ? 'wall-next-3d' : undefined;
      const topBg = isNext ? '' : BACK_TOP; // the glow animates the background itself
      if (where === 'bottom') {
        stacks.push(<Box key={i} x={XC + L / 2 - (k + 1) * P + shift * -1 + 0} y={Y1 - SD} w={SW} d={SD} h={h} top={topBg} south={layers} topCls={topCls} />);
      } else if (where === 'top') {
        stacks.push(<Box key={i} x={XC - L / 2 + k * P + shift} y={Y0} w={SW} d={SD} h={h} top={topBg} south={layers} topCls={topCls} />);
      } else if (where === 'left') {
        stacks.push(<Box key={i} x={X0} y={YC + L / 2 - (k + 1) * P - shift} w={SD} d={SW} h={h} top={topBg} south={layers} east={layers} topCls={topCls} />);
      } else {
        stacks.push(<Box key={i} x={X1 - SD} y={YC - L / 2 + k * P + shift} w={SD} d={SW} h={h} top={topBg} south={layers} west={layers} topCls={topCls} />);
      }
    }
  });

  // --- The other players' hands, standing, backs to you ---
  const hands: ReactNode[] = [];
  for (const seat of [0, 1, 2, 3]) {
    if (seat === hs) continue;
    const side = seatSide(seat);
    const n = handCount(seat);
    // Side players' tiles are drawn thicker than life so their tops read from this angle.
    const TW = 30, TT = side === 'top' ? 14 : 22, TH = side === 'top' ? 40 : 32;
    const span = n * (TW + 1);
    for (let k = 0; k < n; k++) {
      const edge = `linear-gradient(to bottom, ${EDGE} 0 50%, ${BACK_TOP} 50%)`;
      if (side === 'top') {
        hands.push(<Box key={`h${seat}-${k}`} x={XC - span / 2 + k * (TW + 1)} y={34} w={TW} d={TT} h={TH} top={`linear-gradient(to bottom, ${BACK_TOP} 0 50%, ${EDGE} 50%)`} south={BACK} />);
      } else if (side === 'left') {
        hands.push(<Box key={`h${seat}-${k}`} x={compact ? X0 - 30 - TT : 60} y={YC - span / 2 + k * (TW + 1)} w={TT} d={TW} h={TH} top={`linear-gradient(to right, ${EDGE} 0 30%, ${BACK_TOP} 30%)`} east={BACK} south={edge} />);
      } else {
        hands.push(<Box key={`h${seat}-${k}`} x={compact ? X1 + 30 : W - 60 - TT} y={YC - span / 2 + k * (TW + 1)} w={TT} d={TW} h={TH} top={`linear-gradient(to left, ${EDGE} 0 30%, ${BACK_TOP} 30%)`} west={BACK} south={edge} />);
      }
    }
  }

  // --- Flowers and shown sets, face up in front of each player ---
  const shown: ReactNode[] = [];
  for (const seat of [0, 1, 2, 3]) {
    const side = seatSide(seat);
    const items: ReactNode[] = [
      ...state.melds[seat].flatMap(m => m.tiles.map(t => <TileFace index={tileToIndex(t)} size="sm" />)),
      ...(hideFlowers ? [] : state.flowers[seat].map(b => bonusArt(b))),
    ];
    const FW = 24, FP = 26, FD = Math.round(FW * 1.36) + 2;
    items.forEach((node, k) => {
      let x: number, y: number;
      if (side === 'top') { x = XC - (items.length * FP) / 2 + k * FP; y = 64; }
      else if (side === 'bottom') { x = XC - (items.length * FP) / 2 + k * FP; y = Y1 + 16; }
      else if (compact) {
        // Corners: three across, filling the corner nearest you first, then the far one.
        // Four across once there are more than 18, so nothing is drawn on top of anything else.
        const cols = items.length > 18 ? 4 : 3, per = cols * 3;
        const corner = Math.floor(k / per), r = Math.floor((k % per) / cols), c = k % cols;
        y = corner === 0 ? Y1 + 12 + r * FD : 8 + r * FD;
        x = side === 'left' ? 6 + c * FP : W - 6 - FW - (cols - 1 - c) * FP;
      } else {
        const perCol = 14;
        const col = Math.floor(k / perCol), row = k % perCol;
        const colItems = Math.min(perCol, items.length - col * perCol);
        y = YC - (colItems * FD) / 2 + row * FD;
        x = side === 'left' ? 104 + col * FP : W - 104 - FW - col * FP;
      }
      shown.push(<FlatTile key={`s${seat}-${k}`} x={x} y={y} w={FW}>{node}</FlatTile>);
    });
  }

  // --- Throws, face up in front of whoever threw them, oldest nearest their wall ---
  const thrown: ReactNode[] = [];
  const bySeat: { tile: number; i: number }[][] = [[], [], [], []];
  state.discardLog.forEach((d, i) => bySeat[d.player].push({ tile: d.tile, i }));
  for (const seat of [0, 1, 2, 3]) {
    const side = seatSide(seat);
    const list = bySeat[seat];
    const horiz = side === 'top' || side === 'bottom';
    // Bigger tiles while there's room; shrink once a player has thrown a lot.
    const cap = horiz ? 30 : 24;
    const TW = list.length > cap ? 24 : 30;
    const pitchX = TW + 1, pitchY = Math.round(TW * 1.36) + 2;
    const perRow = horiz ? Math.floor((X1 - X0 - 2 * SD - 16) / pitchX) : Math.floor(110 / pitchX);
    list.forEach((d, k) => {
      const row = Math.floor(k / perRow), col = k % perRow;
      let x: number, y: number;
      const rowLen = Math.min(perRow, list.length - row * perRow);
      if (side === 'bottom') { x = XC - (rowLen * pitchX) / 2 + col * pitchX; y = Y1 - SD - 8 - (row + 1) * pitchY; }
      else if (side === 'top') { x = XC - (rowLen * pitchX) / 2 + col * pitchX; y = Y0 + SD + 8 + row * pitchY; }
      else {
        // Side players fill columns: nearest their wall first, top to bottom.
        const colsH = Math.floor((Y1 - Y0 - 2 * SD - 2 * 3 * pitchY) / pitchY);
        const c = Math.floor(k / colsH), r = k % colsH;
        y = Y0 + SD + 8 + 2 * pitchY + r * pitchY + (TW === 30 ? 0 : 6);
        x = side === 'left' ? X0 + SD + 8 + c * pitchX : X1 - SD - 8 - TW - c * pitchX;
      }
      thrown.push(
        <FlatTile key={`d${d.i}`} x={x} y={y} w={TW} ring={d.i === lastIdx}>
          <TileFace index={d.tile} size="sm" />
        </FlatTile>,
      );
    });
  }

  // --- Names and winds on the felt ---
  const label = (seat: number) => {
    const w = seatWind(seat, state.dealerSeat);
    const side = seatSide(seat);
    const playing = state.currentPlayer === seat && state.phase !== 'finished';
    const dealer = seat === state.dealerSeat;
    const style: CSSProperties = { position: 'absolute', whiteSpace: 'nowrap', transform: 'translateZ(1px)' };
    let pos: CSSProperties;
    if (side === 'bottom') pos = { left: XC, top: H - 46, transform: 'translate(-50%, 0) translateZ(1px)' };
    // Beside the hand: anything behind standing tiles is hidden from this angle.
    else if (side === 'top') pos = { left: XC + (handCount(seat) * 31) / 2 + 14, top: 30, transform: 'translateZ(1px)' };
    else if (side === 'left') pos = { left: compact ? 14 : 22, top: YC, transform: 'translate(-50%, -50%) rotate(-90deg) translateZ(1px)' };
    else pos = { left: W - (compact ? 14 : 22), top: YC, transform: 'translate(-50%, -50%) rotate(90deg) translateZ(1px)' };
    return (
      <div key={`n${seat}`} style={{ ...style, ...pos }}>
        <div className={`flex items-center gap-2 rounded-full px-3 py-0.5 ${compact ? 'text-[30px]' : 'text-[24px]'} font-bold leading-tight ${playing ? 'bg-amber-300 text-[#2a1a0c] table-turn' : 'bg-black/35 text-amber-50'}`}>
          <span>{WIND_CHARS[w]}</span>
          <span className={compact ? 'text-[26px]' : 'text-[20px]'}>{seatName(seat)}</span>
          {dealer && <span className={`text-[15px] rounded px-1.5 ${playing ? 'bg-[#2a1a0c] text-amber-200' : 'bg-amber-400 text-[#2a1a0c]'}`}>Dealer</span>}
        </div>
      </div>
    );
  };

  // --- Centre: the round, the dealer, tiles left, and an arrow to whoever's playing ---
  const curSide = seatSide(state.currentPlayer);
  const arrowRot = { bottom: 180, left: 270, top: 0, right: 90 }[curSide];
  const wallLeft = state.wall.length;
  const centre = (
    <div
      style={{ position: 'absolute', left: XC - 105, top: YC - 92, width: 210, height: 184, transform: `translateZ(2px) scale(${compact ? 1.25 : 1})` }}
      className="rounded-2xl bg-black/30 border border-amber-200/20 flex flex-col items-center justify-center text-amber-50 leading-tight"
    >
      {showDice ? (
        <>
          <div className="flex gap-3 scale-[1.6] mb-5"><DiceFace value={dice.a} /><DiceFace value={dice.b} /></div>
          <div className="text-[26px] font-bold">{dice.a} + {dice.b} = {dice.a + dice.b}</div>
        </>
      ) : (
        <>
          <div className="text-[22px] font-bold">{WIND_CHARS[state.prevailingWind]} {WIND_EN[state.prevailingWind]} round</div>
          <div className="text-[18px] text-amber-100/80 mt-1">{wallLeft} tiles left</div>
          {state.phase !== 'finished' && (
            <div className="mt-2 flex items-center gap-2">
              <svg viewBox="0 0 20 20" width="34" height="34" style={{ transform: `rotate(${arrowRot}deg)` }}>
                <path d="M10 2 L18 14 H12 V18 H8 V14 H2 Z" fill="#f4c76a" />
              </svg>
              <span className="text-[20px] font-semibold text-amber-200">{state.currentPlayer === hs ? 'You' : seatName(state.currentPlayer)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {stacks}
      {thrown}
      {shown}
      {hands}
      {centre}
      {[0, 1, 2, 3].map(label)}
    </>
  );
});
