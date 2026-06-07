import { type GameState, scoreWinForSeat } from '@mahjongkaki/game';
import { type Wind, WINDS, calculatePayout, STAKE_PRESETS } from '@mahjongkaki/engine';
import type { AiProfile } from '@mahjongkaki/ai';
import type { SpeedSetting } from './GameSetup';

export interface MatchState {
  stakeIndex: number;
  humanSeat: number;
  difficulty: AiProfile['difficulty'];
  speed: SpeedSetting;
  dealerSeat: number;
  prevailingWind: Wind;
  handNo: number;        // 1-based
  dealerStreak: number;  // consecutive dealer holds
  totals: [number, number, number, number]; // cumulative chip delta per seat
}

export function newMatch(c: {
  difficulty: AiProfile['difficulty']; speed: SpeedSetting; humanSeat: number; stakeIndex: number;
}): MatchState {
  return {
    stakeIndex: c.stakeIndex,
    humanSeat: c.humanSeat,
    difficulty: c.difficulty,
    speed: c.speed,
    dealerSeat: 0,
    prevailingWind: 'east',
    handNo: 1,
    dealerStreak: 0,
    totals: [0, 0, 0, 0],
  };
}

export function seatWindOf(seat: number, dealerSeat: number): Wind {
  return WINDS[(seat - dealerSeat + 4) % 4];
}

// Chip deltas for a finished hand (seat-indexed). Draw / invalid → all zero.
export function handDeltas(state: GameState, stakeIndex: number): [number, number, number, number] {
  const deltas: [number, number, number, number] = [0, 0, 0, 0];
  if (state.winner === null) return deltas;
  const scoring = scoreWinForSeat(state, state.winner);
  if (!scoring || !scoring.isValid) return deltas;
  const names: [string, string, string, string] = ['0', '1', '2', '3'];
  const shooterIndex =
    state.winType === 'discard' && state.lastDiscard ? state.lastDiscard.player : undefined;
  const payout = calculatePayout({
    scoring, stake: STAKE_PRESETS[stakeIndex], winnerIndex: state.winner, shooterIndex, playerNames: names,
  });
  for (let i = 0; i < 4; i++) deltas[i] = payout.netPerPlayer[String(i)] ?? 0;
  return deltas;
}

// Advance dealer + prevailing wind after a hand (SG: dealer keeps on win/draw, else rotates;
// prevailing wind advances when the dealer button completes a full cycle back to seat 0).
export function advanceMatch(
  m: MatchState,
  deltas: [number, number, number, number],
  winner: number | null,
): MatchState {
  const totals = m.totals.map((t, i) => t + deltas[i]) as [number, number, number, number];
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
