import { useEffect } from 'react';
import { type GameState, scoreWinForSeat } from '@mahjongkaki/game';
import { tileToIndex, type Wind, WINDS } from '@mahjongkaki/engine';
import { TileRow } from './TileRow';
import { Scoreboard } from './Scoreboard';
import { type MatchState } from './match';
import { haptics } from '../../lib/haptics';
import { TermTip } from '../TermTip';

const WIND_CHARS: Record<Wind, string> = { east: '東', south: '南', west: '西', north: '北' };

interface RoundResultProps {
  state: GameState;
  match: MatchState;
  deltas: number[];
  onNextHand: () => void;
  onEndMatch: () => void;
}

function seatWind(seat: number, dealerSeat: number): Wind {
  return WINDS[(seat - dealerSeat + 4) % 4];
}

const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

export function RoundResult({ state, match, deltas, onNextHand, onEndMatch }: RoundResultProps) {
  const isDraw = state.winner === null;
  const isHumanWin = state.winner === state.humanSeat;
  const scoring = state.winner !== null ? scoreWinForSeat(state, state.winner) : null;

  useEffect(() => { if (isHumanWin) haptics.success(); }, [isHumanWin]);

  // seatWind here uses the dealer of the hand just played; match.dealerSeat has already
  // advanced, so derive the played hand's dealer from the gameState itself.
  const playedDealer = state.dealerSeat;

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
            {isHumanWin && (
              <div className="wintile-scene mb-3">
                <div className="wintile3d">
                  <div className="wintile-front">
                    <span style={{ color: '#b5392a', fontWeight: 800, fontSize: '2.5rem', lineHeight: 1 }}>中</span>
                  </div>
                  <div className="wintile-back" />
                </div>
              </div>
            )}
            <h2 className={`text-2xl font-bold mb-1 ${isHumanWin ? 'text-emerald-400' : 'text-red-400'}`}>
              {isHumanWin ? 'You Win!' : `${WIND_CHARS[seatWind(state.winner!, playedDealer)]} Wins`}
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
          </>
        )}
      </section>

      <div className="anim-rise" style={delay(80)}>
        <Scoreboard match={match} deltas={deltas} />
      </div>

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

      <div className="anim-rise flex gap-2" style={delay(240)}>
        <button
          onClick={onNextHand}
          className="flex-1 min-h-[48px] btn-primary text-base font-semibold rounded-xl"
        >
          Next hand →
        </button>
        <button
          onClick={onEndMatch}
          className="min-h-[48px] px-5 text-sm font-medium btn-ghost rounded-xl active:scale-95 active:bg-slate-600"
        >
          End match
        </button>
      </div>
    </div>
  );
}
