import { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import { type GameState, scoreWinForSeat } from '@mahjongkaki/game';
import {
  tileToIndex, type Wind, WINDS,
  calculatePayout, formatSettlement, STAKE_PRESETS,
} from '@mahjongkaki/engine';
import { TileRow } from './TileRow';
import { fadeUp, staggerContainer, spring, springSoft } from '../../lib/motion';

const WIND_CHARS: Record<Wind, string> = { east: '東', south: '南', west: '西', north: '北' };
const DEMO_STAKE = STAKE_PRESETS.find(s => s.label === '50¢/$1') ?? STAKE_PRESETS[0];

function CountUp({ to }: { to: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: x => setV(Math.round(x)),
    });
    return () => controls.stop();
  }, [to]);
  return <>{v}</>;
}

interface RoundResultProps {
  state: GameState;
  onPlayAgain: () => void;
  onBackToSetup: () => void;
}

function seatWind(seat: number, dealerSeat: number): Wind {
  return WINDS[(seat - dealerSeat + 4) % 4];
}

export function RoundResult({ state, onPlayAgain, onBackToSetup }: RoundResultProps) {
  const isDraw = state.winner === null;
  const isHumanWin = state.winner === state.humanSeat;
  const scoring = state.winner !== null ? scoreWinForSeat(state, state.winner) : null;

  const names = [0, 1, 2, 3].map(i =>
    i === state.humanSeat ? 'You' : WIND_CHARS[seatWind(i, state.dealerSeat)],
  ) as [string, string, string, string];

  let settlement: string[] = [];
  if (scoring && state.winner !== null) {
    const shooterIndex =
      state.winType === 'discard' && state.lastDiscard ? state.lastDiscard.player : undefined;
    const payout = calculatePayout({
      scoring, stake: DEMO_STAKE, winnerIndex: state.winner, shooterIndex, playerNames: names,
    });
    settlement = formatSettlement(payout.netPerPlayer);
  }

  return (
    <motion.div
      className="space-y-4 pb-4"
      variants={staggerContainer(0.09, 0.05)}
      initial="hidden"
      animate="show"
    >
      <motion.section
        variants={fadeUp}
        className="relative overflow-hidden bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center"
      >
        {isHumanWin && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(60% 60% at 50% 35%, rgba(201,162,75,0.22), transparent 70%)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.6] }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        )}
        {isDraw ? (
          <>
            <h2 className="text-2xl font-bold text-slate-300 mb-2">Draw</h2>
            <p className="text-slate-400 text-sm">Wall exhausted</p>
          </>
        ) : (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={springSoft}>
            <h2 className={`text-2xl font-bold mb-1 ${isHumanWin ? 'text-emerald-400' : 'text-red-400'}`}>
              {isHumanWin ? 'You Win!' : `${WIND_CHARS[seatWind(state.winner!, state.dealerSeat)]} Wins`}
            </h2>
            <p className="text-slate-400 text-xs mb-3">
              {state.winType === 'zimo' ? 'Self-drawn (Zimo)' : 'Discard win'}
            </p>
            {scoring && (
              <div className="relative text-5xl font-extrabold text-amber-400 drop-shadow-[0_2px_12px_rgba(201,162,75,0.45)]">
                <CountUp to={scoring.cappedTai} />
                <span className="text-lg font-semibold text-amber-500/80"> tai</span>
              </div>
            )}
          </motion.div>
        )}
      </motion.section>

      {scoring && state.winner !== null && (
        <>
          <motion.section variants={fadeUp} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Winning Hand</h3>
            <TileRow tiles={state.hands[state.winner]} sortTiles={true} />
            {state.melds[state.winner].length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-slate-500 mr-1">Melds:</span>
                <TileRow
                  tiles={state.melds[state.winner].flatMap(m => m.tiles.map(t => tileToIndex(t)))}
                  size="sm"
                  sortTiles={false}
                />
              </div>
            )}
          </motion.section>

          <motion.section variants={fadeUp} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Scoring</h3>
            {scoring.elements.length === 0 ? (
              <p className="text-xs text-slate-500">No tai elements.</p>
            ) : (
              <div className="space-y-1">
                {scoring.elements.map((e, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06, ...spring }}
                    className="flex justify-between text-xs"
                  >
                    <span className="text-slate-300">{e.name} <span className="text-slate-500">{e.nameZh}</span></span>
                    <span className="text-amber-400 font-medium">+{e.tai}</span>
                  </motion.div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-1 border-t border-slate-700/50 mt-1">
                  <span className="text-slate-200">
                    Total{scoring.totalTai !== scoring.cappedTai ? ` (capped from ${scoring.totalTai})` : ''}
                  </span>
                  <span className="text-amber-400">{scoring.cappedTai} tai</span>
                </div>
              </div>
            )}
          </motion.section>

          {settlement.length > 0 && (
            <motion.section variants={fadeUp} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-300 mb-1">
                Settlement <span className="text-xs font-normal text-slate-500">· example at {DEMO_STAKE.label}</span>
              </h3>
              <div className="space-y-0.5">
                {settlement.map((line, i) => (
                  <p key={i} className="text-xs text-slate-400">{line}</p>
                ))}
              </div>
            </motion.section>
          )}
        </>
      )}

      <motion.section variants={fadeUp} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300 mb-2">Game Stats</h3>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div>Turns played: {state.turnCount}</div>
          <div>Wall remaining: {state.wall.length}</div>
        </div>
      </motion.section>

      <motion.div variants={fadeUp} className="flex gap-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onPlayAgain}
          className="flex-1 py-3 text-sm font-medium bg-emerald-700 text-white rounded-xl active:bg-emerald-600"
        >
          Play Again
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onBackToSetup}
          className="flex-1 py-3 text-sm font-medium bg-slate-700 text-slate-300 rounded-xl active:bg-slate-600"
        >
          New Setup
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
