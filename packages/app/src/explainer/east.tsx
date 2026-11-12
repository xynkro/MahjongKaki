// Explainer: Who is East? Picking the dealer and how East moves round the table. Seven scenes, data/east.json.
import type { ReactNode } from 'react';
import { tileToIndex, wind, type Wind } from '@mahjongkaki/engine';
import { DiceFace } from '../components/game/Wall';
import { Felt, Pop, Tile, TileBack, at, clamp, ease, lerp, type SceneData } from './kit';

const CX = 328;
const CY = 350;
const WIND_TILE: Record<Wind, number> = {
  east: tileToIndex(wind('east')), south: tileToIndex(wind('south')),
  west: tileToIndex(wind('west')), north: tileToIndex(wind('north')),
};
const WIND_EN: Record<Wind, string> = { east: 'East', south: 'South', west: 'West', north: 'North' };
const ORDER: Wind[] = ['east', 'south', 'west', 'north'];

// Seats on screen, in turn order (to the right = anticlockwise seen from above): bottom, right, top, left.
const SEATS = [
  { x: CX, y: CY + 250, name: 'A', color: '#e8a33d' },
  { x: CX + 250, y: CY, name: 'B', color: '#5aa9e6' },
  { x: CX, y: CY - 250, name: 'C', color: '#c779d0' },
  { x: CX - 250, y: CY, name: 'D', color: '#ef6b5a' },
];

function Abs({ x, y, children, z }: { x: number; y: number; children: ReactNode; z?: number }) {
  return <div className="absolute" style={{ left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: z }}>{children}</div>;
}
function Label({ children, size = 44, color = '#f2f0ea' }: { children: ReactNode; size?: number; color?: string }) {
  return <div className="font-display font-bold text-center whitespace-nowrap" style={{ fontSize: size, color, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>{children}</div>;
}

export function Seat({ i, glow = 0, children }: { i: number; glow?: number; children?: ReactNode }) {
  const s = SEATS[i];
  return (
    <Abs x={s.x} y={s.y}>
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-[70px] h-[70px] rounded-full grid place-items-center font-display font-bold text-[30px] text-[#16181b]"
          style={{ background: s.color, boxShadow: `0 0 0 ${4 * glow}px #f2c14e, 0 0 ${30 * glow}px rgba(242,193,78,${0.8 * glow}), 0 6px 14px rgba(0,0,0,0.4)` }}
        >
          {s.name}
        </div>
        {children}
      </div>
    </Abs>
  );
}

export function Table() {
  return <div className="absolute rounded-2xl" style={{ left: CX - 150, top: CY - 150, width: 300, height: 300, background: 'rgba(0,0,0,0.12)', boxShadow: 'inset 0 0 0 2px rgba(234,219,185,0.25)' }} />;
}

/** Wind badges by seat. `eastAt` = seat index holding East; others follow to the right. */
export function WindBadges({ eastAt, show = 1, k = 1 }: { eastAt: number; show?: number; k?: number }) {
  return (
    <>
      {ORDER.slice(0, show).map((w, n) => {
        const seat = (eastAt + n) % 4;
        const s = SEATS[seat];
        // Badge sits between seat and table.
        const bx = lerp(s.x, CX, 0.42);
        const by = lerp(s.y, CY, 0.42);
        return (
          <Abs key={w} x={bx} y={by} z={5}>
            <div className="flex flex-col items-center gap-1" style={{ opacity: k }}>
              <Tile index={WIND_TILE[w]} w={48} />
              <div className={`font-display font-bold text-[24px] ${w === 'east' ? 'text-[#f2c14e]' : 'text-[#f2f0ea]'}`}>{WIND_EN[w]}</div>
            </div>
          </Abs>
        );
      })}
    </>
  );
}

/* ---------- 1: the dealer sits East ---------- */
function Dealer({ s, t }: { s: SceneData; t: number }) {
  const tDong = at(s, 'dong');
  return (
    <Felt>
      <Table />
      {SEATS.map((_, i) => <Seat key={i} i={i} />)}
      <Abs x={CX} y={CY}>
        <Pop t={t} from={at(s, 'east')}>
          <div className="flex flex-col items-center gap-3">
            <div style={{ transform: `scale(${1 + 0.12 * ease(t, tDong, 0.3) - 0.12 * ease(t, tDong + 0.3, 0.3)})` }}>
              <Tile index={WIND_TILE.east} w={96} />
            </div>
            <Label size={40}>East = dealer</Label>
          </div>
        </Pop>
      </Abs>
      <Abs x={CX} y={CY + 125}>
        <Pop t={t} from={tDong}><Label size={36} color="#f2c14e">東 dōng</Label></Pop>
      </Abs>
    </Felt>
  );
}

/* ---------- 2: everyone rolls, highest is East ---------- */
const ROLLS: [number, number][] = [[6, 5], [3, 4], [2, 5], [4, 1]];
function Dice({ s, t }: { s: SceneData; t: number }) {
  const tRoll = at(s, 'everyone');
  const tHigh = at(s, 'highest');
  return (
    <Felt>
      <Table />
      {SEATS.map((_, i) => {
        const from = tRoll + i * 0.35;
        const k = ease(t, from, 0.3);
        const [a, b] = ROLLS[i];
        const tumble = clamp((t - from) / 0.6);
        const shown = (v: number) => (tumble < 1 ? 1 + Math.floor((t * 17 + v + i) % 6) : v);
        const best = i === 0 ? ease(t, tHigh, 0.4) : 0;
        return (
          <Seat key={i} i={i} glow={best}>
            <div className="flex items-center gap-2" style={{ opacity: k }}>
              <DiceFace value={shown(a)} />
              <DiceFace value={shown(b)} />
              <span className="font-display font-bold text-[30px] w-10" style={{ color: best ? '#f2c14e' : '#f2f0ea', opacity: tumble >= 1 ? 1 : 0 }}>{a + b}</span>
            </div>
          </Seat>
        );
      })}
      <Abs x={CX} y={CY}>
        <Pop t={t} from={tHigh + 0.4}>
          <div className="flex flex-col items-center gap-2">
            <Tile index={WIND_TILE.east} w={70} />
            <Label size={30}>A rolled 11: East</Label>
          </div>
        </Pop>
      </Abs>
    </Felt>
  );
}

/* ---------- 3: or turn over the wind tiles ---------- */
function WindDraw({ s, t }: { s: SceneData; t: number }) {
  const tMix = at(s, 'mix');
  const tTurn = at(s, 'turns');
  const tGets = at(s, 'gets');
  // A drew East, B South, C West, D North.
  return (
    <Felt>
      <Table />
      {SEATS.map((_, i) => <Seat key={i} i={i} glow={i === 0 ? ease(t, tGets, 0.4) : 0} />)}
      {ORDER.map((w, i) => {
        const swirl = clamp((t - tMix) / 1.6);
        const ang = i * (Math.PI / 2) + swirl * Math.PI * 2 * (1 - ease(t, tTurn - 0.6, 0.6));
        const r = 60;
        const home = { x: CX + Math.cos(ang) * r, y: CY + Math.sin(ang) * r };
        const seat = SEATS[i];
        const go = ease(t, tTurn + i * 0.35, 0.5);
        const x = lerp(home.x, lerp(seat.x, CX, 0.42), go);
        const y = lerp(home.y, lerp(seat.y, CY, 0.42), go);
        const flip = clamp((t - (tTurn + i * 0.35 + 0.5)) / 0.3);
        const sx = Math.abs(1 - 2 * flip);
        return (
          <Abs key={w} x={x} y={y} z={5}>
            <div style={{ transform: `scaleX(${sx})` }}>{flip < 0.5 ? <TileBack w={48} /> : <Tile index={WIND_TILE[w]} w={48} />}</div>
          </Abs>
        );
      })}
    </Felt>
  );
}

/* ---------- 4: the winds follow to the right ---------- */
export function Follow({ s, t }: { s: SceneData; t: number }) {
  const times = [0, at(s, 'south'), at(s, 'west'), at(s, 'north')];
  const shown = times.filter(x => t >= x).length;
  const arrow = ease(t, at(s, 'right'), 1.2);
  return (
    <Felt>
      <Table />
      {SEATS.map((_, i) => <Seat key={i} i={i} glow={i === shown - 1 && i > 0 ? 1 - ease(t, times[i] + 0.6, 0.4) : 0} />)}
      <WindBadges eastAt={0} show={shown} />
      {/* Turn-order arc, bottom → right → top → left */}
      <svg className="absolute" style={{ left: CX - 110, top: CY - 110 }} width={220} height={220} viewBox="-110 -110 220 220">
        <path
          d={arcPath(arrow)}
          fill="none" stroke="#f2c14e" strokeWidth={6} strokeLinecap="round" opacity={0.9}
        />
      </svg>
    </Felt>
  );
}
function arcPath(k: number) {
  // From the bottom (90°) going anticlockwise on screen (through right = 0°, top = -90°, left = 180°).
  const r = 80;
  const a0 = Math.PI / 2;
  const a1 = a0 - k * Math.PI * 1.75;
  const p = (a: number) => `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
  if (k <= 0.001) return '';
  const large = k * 1.75 > 1 ? 1 : 0;
  return `M ${p(a0)} A ${r} ${r} 0 ${large} 0 ${p(a1)}`;
}

/* ---------- 5: East stays or moves ---------- */
function Moves({ s, t }: { s: SceneData; t: number }) {
  const tStay = at(s, 'dealer');
  const tNobody = at(s, 'nobody');
  const tOther = at(s, 'anyone');
  const tMove = at(s, 'moves');
  const move = ease(t, tMove, 0.9);
  const eastAt = move >= 1 ? 1 : 0;
  const banner = t >= tOther ? 'B wins: East moves on' : t >= tNobody ? 'Nobody wins: East stays' : t >= tStay ? 'A wins: East stays' : '';
  return (
    <Felt>
      <Table />
      {SEATS.map((_, i) => (
        <Seat key={i} i={i} glow={(t >= tStay && t < tNobody && i === 0) || (t >= tOther && i === 1) ? 1 : 0} />
      ))}
      {move > 0 && move < 1 ? (
        // East tile slides from A's badge spot to B's.
        <Abs x={lerp(lerp(SEATS[0].x, CX, 0.42), lerp(SEATS[1].x, CX, 0.42), move)} y={lerp(lerp(SEATS[0].y, CY, 0.42), lerp(SEATS[1].y, CY, 0.42), move)} z={6}>
          <Tile index={WIND_TILE.east} w={48} />
        </Abs>
      ) : (
        <WindBadges eastAt={eastAt} show={4} />
      )}
      <Abs x={CX} y={34}>
        {banner && <Label size={34} color="#f2c14e">{banner}</Label>}
      </Abs>
    </Felt>
  );
}

/* ---------- 6: round wind changes ---------- */
export function Round({ s, t }: { s: SceneData; t: number }) {
  const tAll = at(s, 'all');
  const tSouth = at(s, 'south');
  // East travels B → C → D → back to A on a circle through the badge spots while she says "all the way round".
  const p = ease(t, tAll, 2.4) * 3;
  const R = 250 * 0.58; // badge spots sit 42% of the way in from each seat
  const ang = -p * (Math.PI / 2); // B is at angle 0 (right); turning to the right goes up the screen first
  const x = CX + Math.cos(ang) * R;
  const y = CY + Math.sin(ang) * R;
  const flip = ease(t, tSouth, 0.5);
  return (
    <Felt>
      <Table />
      {SEATS.map((_, i) => <Seat key={i} i={i} />)}
      <Abs x={x} y={y} z={6}><Tile index={WIND_TILE.east} w={44} /></Abs>
      <Abs x={CX} y={CY}>
        <div className="flex flex-col items-center gap-1">
          <div className="text-[20px] font-semibold text-[#9aa0a6]">Round wind</div>
          <div style={{ transform: `scaleY(${Math.abs(1 - 2 * flip)})` }}>
            <Tile index={flip < 0.5 ? WIND_TILE.east : WIND_TILE.south} w={56} />
          </div>
          <Label size={26}>{flip < 0.5 ? 'East round' : 'South round'}</Label>
        </div>
      </Abs>
    </Felt>
  );
}

/* ---------- 7: recap ---------- */
function Recap({ s, t }: { s: SceneData; t: number }) {
  const items = [
    { from: at(s, 'roll'), text: 'Roll for East' },
    { from: at(s, 'winds'), text: 'Winds go to the right' },
    { from: at(s, 'moves'), text: 'Someone else wins: East moves' },
  ];
  return (
    <Felt>
      <div className="absolute left-[64px] top-[150px] flex flex-col gap-10">
        {items.map((it, i) => (
          <Pop key={i} t={t} from={it.from}>
            <div className="flex items-center gap-5">
              <span className="w-14 h-14 shrink-0 rounded-full bg-[#3ccf8e] text-[#0c2a1d] grid place-items-center text-[34px] font-bold">✓</span>
              <span className="font-display font-bold text-[40px] leading-tight text-[#f2f0ea]">{it.text}</span>
            </div>
          </Pop>
        ))}
      </div>
    </Felt>
  );
}

export const EAST_SCENES = [Dealer, Dice, WindDraw, Follow, Moves, Round, Recap];
