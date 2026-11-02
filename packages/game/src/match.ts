import { type StakeConfig, type Wind, WINDS, calculatePayout } from '@mahjongkaki/engine';
import type { GameState } from './game-state.js';
import { scoreWinForSeat } from './score.js';

export type SeatTotals = [number, number, number, number];

export interface MatchProgress {
  dealerSeat: number;
  prevailingWind: Wind;
  handNo: number;        // 1-based
  dealerStreak: number;  // consecutive dealer holds
  totals: SeatTotals;    // cumulative delta per seat
}

// What each seat won or lost on a finished hand. Draw / invalid → all zero.
export function handNet(state: GameState, stake: StakeConfig): SeatTotals {
  const deltas: SeatTotals = [0, 0, 0, 0];
  if (state.winner === null) return deltas;
  const scoring = scoreWinForSeat(state, state.winner);
  if (!scoring || !scoring.isValid) return deltas;
  const names: [string, string, string, string] = ['0', '1', '2', '3'];
  const shooterIndex =
    state.winType === 'discard' && state.lastDiscard ? state.lastDiscard.player : undefined;
  const payout = calculatePayout({
    scoring, stake, winnerIndex: state.winner, shooterIndex, playerNames: names,
    rules: state.rules,
  });
  for (let i = 0; i < 4; i++) deltas[i] = payout.netPerPlayer[String(i)] ?? 0;
  return deltas;
}

// Advance dealer + prevailing wind after a hand (SG: dealer keeps on win/draw, else rotates;
// prevailing wind advances when the dealer button completes a full cycle back to seat 0).
export function advanceProgress<T extends MatchProgress>(m: T, deltas: SeatTotals, winner: number | null): T {
  const totals = m.totals.map((t, i) => t + deltas[i]) as SeatTotals;
  const dealerStays = winner === null || winner === m.dealerSeat;

  if (dealerStays) {
    return { ...m, totals, dealerStreak: m.dealerStreak + 1, handNo: m.handNo + 1 };
  }
  const dealerSeat = (m.dealerSeat + 1) % 4;
  let prevailingWind = m.prevailingWind;
  if (dealerSeat === 0) {
    prevailingWind = WINDS[(WINDS.indexOf(m.prevailingWind) + 1) % 4];
  }
  return { ...m, totals, dealerSeat, prevailingWind, dealerStreak: 0, handNo: m.handNo + 1 };
}
