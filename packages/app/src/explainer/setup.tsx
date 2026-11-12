// Explainers for the rest of "Setting up the table": dice and the split, the deal, drawing from the wall.
import type { ReactNode } from 'react';
import { tileToIndex, wind, suit } from '@mahjongkaki/engine';
import { DiceFace } from '../components/game/Wall';
import { Felt, Pop, Tile, at, clamp, ease, lerp, type SceneData } from './kit';
import { Abs, Label } from './wall';
import { Ring, seatSpot, stackPos } from './ring';

const CX = 328;
const CY = 350;
const WINDS = [wind('east'), wind('south'), wind('west'), wind('north')].map(tileToIndex);
const NAMES = ['East', 'South', 'West', 'North'];
const GAP = 7; // dice total 7, counted along West's wall

function Check({ items, t }: { items: { from: number; text: string }[]; t: number }) {
  return (
    <div className="absolute left-[64px] top-[130px] flex flex-col gap-9">
      {items.map((it, i) => (
        <Pop key={i} t={t} from={it.from}>
          <div className="flex items-center gap-5">
            <span className="w-14 h-14 shrink-0 rounded-full bg-[#3ccf8e] text-[#0c2a1d] grid place-items-center text-[34px] font-bold">✓</span>
            <span className="font-display font-bold text-[42px] leading-tight text-[#f2f0ea]">{it.text}</span>
          </div>
        </Pop>
      ))}
    </div>
  );
}

/** Notes go in the strip above the top wall so they never cover the seats. */
function Note({ t, from, children, color, y = 52 }: { t: number; from: number; children: ReactNode; color?: string; y?: number }) {
  return <Abs x={CX} y={y} z={8}><Pop t={t} from={from}><Label size={30} color={color}>{children}</Label></Pop></Abs>;
}

function Seats({ glow, counts, show = 1 }: { glow?: number[]; counts?: number[]; show?: number }) {
  return (
    <>
      {WINDS.map((tile, seat) => {
        const p = seatSpot(seat);
        const g = glow?.[seat] ?? 0;
        return (
          <Abs key={seat} x={p.x} y={p.y}>
            <div className="flex flex-col items-center gap-1" style={{ opacity: show }}>
              <div style={{ borderRadius: 10, boxShadow: g ? `0 0 0 ${3 * g}px #f2c14e, 0 0 ${22 * g}px rgba(242,193,78,${0.8 * g})` : undefined }}>
                <Tile index={tile} w={42} />
              </div>
              <div className="font-display font-bold text-[22px] text-[#f2f0ea]">
                {NAMES[seat]}{counts ? <span className="text-[#f2c14e]"> · {counts[seat]}</span> : null}
              </div>
            </div>
          </Abs>
        );
      })}
    </>
  );
}

/* =================== Dice and the split =================== */

function Roll({ s, t }: { s: SceneData; t: number }) {
  const tRoll = at(s, 'rolls');
  const tSeven = at(s, 'seven');
  const tumble = clamp((t - tRoll) / 1.2);
  const face = (v: number, k: number) => (tumble < 1 ? 1 + Math.floor((t * 15 + k * 3) % 6) : v);
  return (
    <Felt>
      <Ring />
      <Abs x={CX} y={CY - 20}>
        <div className="flex gap-10" style={{ transform: `rotate(${(1 - tumble) * 25 * Math.sin(t * 9)}deg)` }}>
          <div className="scale-[2.2]"><DiceFace value={face(4, 1)} /></div>
          <div className="scale-[2.2]"><DiceFace value={face(3, 2)} /></div>
        </div>
      </Abs>
      <Abs x={CX} y={CY + 110}><Pop t={t} from={tSeven}><Label size={52}>4 + 3 = <span className="text-[#f2c14e]">7</span></Label></Pop></Abs>
    </Felt>
  );
}

function CountPlayers({ s, t }: { s: SceneData; t: number }) {
  const hops = [at(s, 'east', 0), at(s, 'south', 0), at(s, 'west', 0), at(s, 'north', 0), at(s, 'east', 1), at(s, 'south', 1), at(s, 'west', 1)];
  const n = hops.filter(h => t >= h).length; // how many counted so far
  const seat = n ? (n - 1) % 4 : 0;
  const landed = t >= at(s, 'lands');
  const p = seatSpot(seat, 150);
  return (
    <Felt>
      <Ring />
      <Seats glow={[0, 0, landed ? 1 : 0, 0]} />
      {n > 0 && (
        <Abs x={p.x} y={p.y} z={5}>
          <div className="w-16 h-16 rounded-full bg-[#f2c14e] text-[#16181b] grid place-items-center font-display font-bold text-[34px]" style={{ boxShadow: '0 6px 16px rgba(0,0,0,0.4)' }}>{n}</div>
        </Abs>
      )}
      <Note t={t} from={at(s, 'lands')} color="#f2c14e">7 lands on West</Note>
    </Felt>
  );
}

function CountStacks({ s, t }: { s: SceneData; t: number }) {
  const k = Math.round(clamp((t - at(s, 'count')) / 2.2) * GAP);
  const tip = stackPos(Math.max(0, k - 1));
  return (
    <Felt>
      <Ring lit={i => i < k} />
      <Seats glow={[0, 0, 1, 0]} />
      {k > 0 && <Abs x={tip.x} y={tip.y + 40} z={5}><Label size={34} color="#f2c14e">{k}</Label></Abs>}
      <Note t={t} from={at(s, 'starting')}>From West’s right-hand end</Note>
    </Felt>
  );
}

function Split({ s, t }: { s: SceneData; t: number }) {
  const open = ease(t, at(s, 'split'), 0.6);
  const tDeal = at(s, 'deal');
  const g = stackPos(GAP);
  return (
    <Felt>
      <Ring gap={GAP} open={open} lit={i => i < GAP && open < 1} next={t >= tDeal ? GAP : undefined} />
      <Note t={t} from={tDeal} color="#f2c14e">The deal starts at the gap</Note>
    </Felt>
  );
}

function DiceRecap({ s, t }: { s: SceneData; t: number }) {
  return <Felt><Check t={t} items={[
    { from: at(s, 'roll'), text: 'Roll two dice' },
    { from: at(s, 'players'), text: 'Count the players' },
    { from: at(s, 'stacks'), text: 'Count the stacks' },
    { from: at(s, 'split'), text: 'Split the wall' },
  ]} /></Felt>;
}

export const DICE_SCENES = [Roll, CountPlayers, CountStacks, Split, DiceRecap];

/* =================== The deal =================== */

/** Tiles each seat holds after `dealt` tiles of the deal. */
function hands(dealt: number): number[] {
  return [0, 1, 2, 3].map(turn => {
    let n = 0;
    for (let r = 0; r < 3; r++) n += Math.max(0, Math.min(4, dealt - (r * 16 + turn * 4)));
    if (dealt > 48 + turn) n += 1;
    if (turn === 0 && dealt > 52) n += 1;
    return n;
  });
}

function DealFrame({ dealt, back = 0, glow, extra }: { dealt: number; back?: number; glow?: number[]; extra?: ReactNode }) {
  return (
    <Felt>
      <Ring gap={GAP} open={1} front={dealt} back={back} />
      <Seats counts={hands(dealt)} glow={glow} />
      {extra}
    </Felt>
  );
}

function DealFirst({ s, t }: { s: SceneData; t: number }) {
  const d = Math.round(clamp((t - at(s, 'takes')) / 0.8) * 4);
  return <DealFrame dealt={d} glow={[d > 0 ? 1 : 0, 0, 0, 0]} extra={<Note t={t} from={at(s, 'four')}>2 stacks = 4 tiles</Note>} />;
}

function DealRounds({ s, t }: { s: SceneData; t: number }) {
  const tS = at(s, 'south'), tW = at(s, 'west'), tN = at(s, 'north'), tRound = at(s, 'round');
  let d = 4;
  d += Math.round(clamp((t - tS) / 0.5) * 4);
  d += Math.round(clamp((t - tW) / 0.5) * 4);
  d += Math.round(clamp((t - tN) / 0.5) * 4);
  d += Math.round(clamp((t - tRound) / 2.2) * 32);
  const who = t >= tRound ? -1 : t >= tN ? 3 : t >= tW ? 2 : t >= tS ? 1 : 0;
  return <DealFrame dealt={d} glow={[0, 1, 2, 3].map(i => (i === who ? 1 : 0))} extra={<Note t={t} from={at(s, 'twelve')}>Three rounds: 12 each</Note>} />;
}

function DealLast({ s, t }: { s: SceneData; t: number }) {
  const d = 48 + Math.round(clamp((t - at(s, 'everyone')) / 1.0) * 4) + (t >= at(s, 'extra') ? 1 : 0);
  return <DealFrame dealt={d} glow={[t >= at(s, 'extra') ? 1 : 0, 0, 0, 0]} extra={<Note t={t} from={at(s, 'extra')}>1 more each, +1 for the dealer</Note>} />;
}

function DealTotals({ s, t }: { s: SceneData; t: number }) {
  return <DealFrame dealt={53} glow={[1, 0, 0, 0]} extra={
    <>
      <Note t={t} from={at(s, 'fourteen')} y={36} color="#f2c14e">Dealer: 14 tiles</Note>
      <Note t={t} from={at(s, 'thirteen')} y={76}>Everyone else: 13</Note>
    </>} />;
}

function DealFlower({ s, t }: { s: SceneData; t: number }) {
  const tRep = at(s, 'replacement');
  const back = t >= tRep + 0.4 ? 1 : 0;
  const east = seatSpot(0);
  return (
    <Felt>
      <Ring gap={GAP} open={1} front={53} back={back} next={t >= tRep && !back ? GAP - 1 : undefined} />
      <Seats counts={hands(53)} />
      <Abs x={east.x + 112} y={east.y - 6}>
        <Pop t={t} from={at(s, 'flower')}>
          <div className="px-4 py-2 rounded-lg bg-[#FBF4E4] text-[#b5392a] font-display font-bold text-[24px] border border-[#C6AE84]">Flower</div>
        </Pop>
      </Abs>
      <Note t={t} from={at(s, 'face')} y={36}>Flowers go face up beside you</Note>
      <Note t={t} from={tRep} y={76} color="#f2c14e">Replacement from the back</Note>
    </Felt>
  );
}

function DealThrow({ s, t }: { s: SceneData; t: number }) {
  const k = ease(t, at(s, 'throws'), 0.6);
  const from = seatSpot(0, 40);
  return (
    <DealFrame dealt={53} extra={
      <>
        <Abs x={lerp(from.x, CX, k)} y={lerp(from.y, CY, k)} z={6}>
          <div style={{ opacity: clamp(k * 4) }}><Tile index={tileToIndex(suit('dot', 9))} w={48} /></div>
        </Abs>
        <Note t={t} from={at(s, 'game')} color="#f2c14e">Game on</Note>
      </>
    } />
  );
}

export const DEAL_SCENES = [DealFirst, DealRounds, DealLast, DealTotals, DealFlower, DealThrow];

/* =================== Drawing from the wall =================== */

const AFTER_DEAL = 53;

function DrawNext({ s, t }: { s: SceneData; t: number }) {
  const tDraw = at(s, 'draw');
  const taken = t >= tDraw + 0.5 ? 1 : 0;
  const nextStack = GAP + Math.floor((AFTER_DEAL + taken) / 2);
  return (
    <Felt>
      <Ring gap={GAP} open={1} front={AFTER_DEAL + taken} next={nextStack} />
      <Seats glow={[1, 0, 0, 0]} />
      <Note t={t} from={tDraw}>Draw from the front</Note>
    </Felt>
  );
}

function DrawShrinks({ s, t }: { s: SceneData; t: number }) {
  const f = AFTER_DEAL + 1 + Math.round(clamp((t - at(s, 'turn')) / Math.max(1, s.dur - 0.5)) * 40);
  return (
    <Felt>
      <Ring gap={GAP} open={1} front={f} next={GAP + Math.floor(f / 2)} />
      <Seats glow={[0, 1, 2, 3].map(i => (Math.floor(f) % 4 === i ? 1 : 0))} />
    </Felt>
  );
}

function DrawBack({ s, t }: { s: SceneData; t: number }) {
  const tOther = at(s, 'other');
  const back = t >= tOther + 0.6 ? 1 : 0;
  return (
    <Felt>
      <Ring gap={GAP} open={1} front={94} back={back} next={t >= tOther ? GAP - 1 : undefined} />
      <Seats />
      <Note t={t} from={at(s, 'flowers')} y={36}>Flower, animal or kong?</Note>
      <Note t={t} from={tOther} y={76} color="#f2c14e">Replacement from the back</Note>
    </Felt>
  );
}

function DrawEmpty({ s, t }: { s: SceneData; t: number }) {
  // Run the front down to the dead wall at the back (16 tiles kept for replacements).
  const f = Math.round(lerp(94, 148 - 16 - 1, ease(t, at(s, 'runs'), 1.6)));
  return (
    <Felt>
      <Ring gap={GAP} open={1} front={f} back={1} />
      <Seats glow={[t >= at(s, 'dealer') ? 1 : 0, 0, 0, 0]} />
      <Note t={t} from={at(s, 'draw')} y={36}>Wall empty: a draw</Note>
      <Note t={t} from={at(s, 'dealer')} y={76} color="#f2c14e">East deals again</Note>
    </Felt>
  );
}

function DrawRecap({ s, t }: { s: SceneData; t: number }) {
  return <Felt><Check t={t} items={[
    { from: at(s, 'normal'), text: 'Normal draws: the front' },
    { from: at(s, 'replacements'), text: 'Replacements: the back' },
  ]} /></Felt>;
}

export const DRAWING_SCENES = [DrawNext, DrawShrinks, DrawBack, DrawEmpty, DrawRecap];
