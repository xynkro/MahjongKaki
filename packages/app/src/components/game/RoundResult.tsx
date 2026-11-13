import { useEffect, useRef, useState } from 'react';
import { type GameState, type MatchProgress, scoreWinForSeat, instantPayments } from '@mahjongkaki/game';
import { tileToIndex, type Wind, WINDS, formatCurrency } from '@mahjongkaki/engine';
import { TileRow } from './TileRow';
import { Scoreboard, type Amount } from './Scoreboard';
import { ChipFlight, FIRST_LAND_MS, chipCountForTai, countDurationMs, dealChips } from './ChipFlight';
import { haptics, sound } from '../../lib/haptics';
import { TermTip } from '../TermTip';
import { WinTileScene } from '../three/WinTileScene';
import { prefersReducedMotion } from '../three/motion';

const WIND_CHARS: Record<Wind, string> = { east: '東', south: '南', west: '西', north: '北' };

interface RoundResultProps {
  state: GameState;
  match: MatchProgress & { humanSeat: number };
  deltas: number[];
  onNextHand: () => void;
  onEndMatch: () => void;
  amount?: Amount;
  names?: string[];
  /** Replaces the Next hand button once you're ready and waiting on the others. */
  waitingNote?: string;
  endLabel?: string;
  /** Stake base for instant payments (units × base). 1 when scoring in points. */
  stakeBase?: number;
}

function seatWind(seat: number, dealerSeat: number): Wind {
  return WINDS[(seat - dealerSeat + 4) % 4];
}

// The tile that completed the hand. Same pick as scoreWinForSeat: the discard for
// a discard win, otherwise the tile the winner just drew.
function winningTile(state: GameState, seat: number): number {
  if (state.winType === 'discard' && state.lastDiscard) return state.lastDiscard.tile;
  if (state.lastDraw?.player === seat) return state.lastDraw.tile;
  const hand = state.hands[seat];
  return hand[hand.length - 1] ?? 0;
}

const WIND_EN: Record<Wind, string> = { east: 'East', south: 'South', west: 'West', north: 'North' };

/** One plain sentence on who paid and why, so the payout is never a mystery. */
function whoPaid(state: GameState, names?: string[]): string {
  const hs = state.humanSeat;
  const who = (seat: number) => (seat === hs ? 'You' : names?.[seat] ?? WIND_EN[seatWind(seat, state.dealerSeat)]);
  const w = state.winner!;
  if (state.winType === 'zimo') {
    return w === hs
      ? 'You drew the winning tile yourself, so all three players pay you double.'
      : `${who(w)} drew the winning tile from the wall, so the other three each pay double.`;
  }
  const shooter = state.lastDiscard?.player;
  if (shooter === undefined) return '';
  const thrower = who(shooter);
  if (state.rules.shooterMode === 'shooterPaysAll') return `${thrower} threw the winning tile, so ${shooter === hs ? 'you pay' : 'they pay'} for the whole table.`;
  if (state.rules.shooterMode === 'halfShooter') return `${thrower} threw the winning tile, so ${shooter === hs ? 'you pay' : 'they pay'} the most and the other two pay half.`;
  return `${thrower} threw the winning tile, so ${shooter === hs ? 'you pay' : 'they pay'} double and the other two pay single.`;
}

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

export function RoundResult({ state, match, deltas, onNextHand, onEndMatch, amount, names, waitingNote, endLabel = 'End match', stakeBase = 1 }: RoundResultProps) {
  const isDraw = state.winner === null;
  const isHumanWin = state.winner === state.humanSeat;
  const scoring = state.winner !== null ? scoreWinForSeat(state, state.winner) : null;
  const myDelta = deltas[state.humanSeat] ?? 0;
  const chipCount = chipCountForTai(scoring?.cappedTai ?? 0);
  const boardRef = useRef<HTMLDivElement>(null);
  const [celebrate] = useState(() => isHumanWin && myDelta > 0 && !prefersReducedMotion());

  // Fanfare, then your chips land as the tile settles. Paying out stays low-key.
  useEffect(() => {
    if (isHumanWin) haptics.win();
    else if (isDraw) sound.handDrawn();
    else if (myDelta < 0) sound.loss();
    if (myDelta > 0) sound.chips(chipCount, isHumanWin ? FIRST_LAND_MS / 1000 : 0);
    else if (myDelta < 0) sound.chips(2, 0.4);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // seatWind here uses the dealer of the hand just played; match.dealerSeat has already
  // advanced, so derive the played hand's dealer from the gameState itself.
  const playedDealer = state.dealerSeat;
  const instant = instantPayments(state);
  const who = (seat: number) => (seat === state.humanSeat ? 'You' : names?.[seat] ?? WIND_EN[seatWind(seat, playedDealer)]);
  const pay = (units: number) => (amount ? `${units * stakeBase} points` : formatCurrency(units * stakeBase));

  return (
    <div className="space-y-4 pb-4">
      <section className="anim-rise card relative overflow-hidden p-6 text-center" style={delay(0)}>
        {isHumanWin && (
          <div className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(60% 60% at 50% 35%, rgba(201,162,75,0.20), transparent 70%)' }} />
        )}
        {isHumanWin && <div className="shimmer-gold" />}
        {isDraw ? (
          <>
            <h2 className="text-2xl font-bold text-slate-300 mb-2">Draw</h2>
            <p className="text-slate-400 text-sm">Wall exhausted — dealer keeps</p>
          </>
        ) : (
          <>
            {isHumanWin && <WinTileScene tile={winningTile(state, state.winner!)} />}
            <h2 className={`text-2xl font-bold mb-1 ${isHumanWin ? 'text-emerald-400' : 'text-red-400'}`}>
              {isHumanWin ? 'You Win!' : `${names?.[state.winner!] ?? WIND_CHARS[seatWind(state.winner!, playedDealer)]} Wins`}
            </h2>
            <p className="text-slate-400 text-xs mb-3">
              {state.winType === 'zimo' ? <>Self-drawn (<TermTip term="zimo">Zimo</TermTip>)</> : 'Discard win'}
            </p>
            {scoring && (
              <div className="anim-win relative text-6xl font-extrabold gold-foil drop-shadow-[0_2px_14px_rgba(201,162,75,0.5)]">
                {scoring.cappedTai}
                <span className="text-xl font-semibold gold-foil"> <TermTip term="tai">tai</TermTip></span>
              </div>
            )}
            {scoring && <p className="text-slate-300 text-[13px] leading-snug mt-3 max-w-xs mx-auto">{whoPaid(state, names)}</p>}
          </>
        )}
      </section>

      <div ref={boardRef} className="anim-rise" style={delay(80)}>
        <Scoreboard
          match={match}
          deltas={deltas}
          amount={amount}
          names={names}
          count={celebrate
            ? { delayMs: FIRST_LAND_MS, durationMs: countDurationMs(chipCount), winner: state.humanSeat }
            : undefined}
        />
      </div>
      {celebrate && (
        <ChipFlight sources={dealChips(deltas, state.humanSeat, chipCount)} winner={state.humanSeat} boardRef={boardRef} />
      )}

      {scoring && state.winner !== null && (
        <section className="anim-rise card p-4" style={delay(160)} aria-live="polite">
          <h3 className="section-title mb-2">Winning Hand</h3>
          <TileRow tiles={state.hands[state.winner]} sortTiles={true} />
          <div className="mt-3 space-y-1">
            {scoring.elements.map((e, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-slate-300">{e.name} <span className="text-slate-500">{e.nameZh}</span></span>
                <span className="text-amber-400 font-medium">+{e.tai}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-slate-700/50 mt-1">
              <span className="text-slate-200">
                Total{scoring.totalTai !== scoring.cappedTai ? ` (capped from ${scoring.totalTai})` : ''}
              </span>
              <span className="text-amber-400">{scoring.cappedTai} tai</span>
            </div>
          </div>
        </section>
      )}

      {instant.length > 0 && (
        <section className="anim-rise card p-4" style={delay(200)}>
          <h3 className="section-title mb-1">Paid on the spot</h3>
          <p className="text-slate-400 text-xs mb-2">Everyone else pays these straight away, win or not.</p>
          <div className="space-y-1">
            {instant.map((p, i) => (
              <div key={i} className="flex justify-between gap-3 text-xs">
                <span className="text-slate-300">{who(p.seat)}: {p.reason}</span>
                <span className="text-amber-400 font-medium shrink-0">{pay(p.units)} from each</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="anim-rise flex gap-2" style={delay(240)}>
        {waitingNote ? (
          <div className="flex-1 min-h-[48px] grid place-items-center text-sm text-slate-300 text-center">{waitingNote}</div>
        ) : (
          <button
            onClick={onNextHand}
            className="flex-1 min-h-[48px] btn-primary text-base font-semibold rounded-xl"
          >
            Next hand →
          </button>
        )}
        <button
          onClick={onEndMatch}
          className="min-h-[48px] px-5 text-sm font-medium btn-ghost rounded-xl active:scale-95 active:bg-slate-600"
        >
          {endLabel}
        </button>
      </div>
    </div>
  );
}
