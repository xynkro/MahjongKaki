import { type GameState, type MatchProgress, type SeatTotals, advanceProgress, handNet } from '@mahjongkaki/game';
import { type Wind, WINDS, STAKE_PRESETS, type RulesConfig } from '@mahjongkaki/engine';
import type { AiProfile } from '@mahjongkaki/ai';
import type { SpeedSetting } from './GameSetup';

export interface MatchState extends MatchProgress {
  stakeIndex: number;
  humanSeat: number;
  difficulty: AiProfile['difficulty'];
  speed: SpeedSetting;
  rules: RulesConfig;    // house rules snapshotted at match start
}

export function newMatch(c: {
  difficulty: AiProfile['difficulty']; speed: SpeedSetting; humanSeat: number; stakeIndex: number;
}, rules: RulesConfig): MatchState {
  return {
    stakeIndex: c.stakeIndex,
    humanSeat: c.humanSeat,
    difficulty: c.difficulty,
    speed: c.speed,
    rules,
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
export function handDeltas(state: GameState, stakeIndex: number): SeatTotals {
  return handNet(state, STAKE_PRESETS[stakeIndex]);
}

export const advanceMatch = advanceProgress<MatchState>;
