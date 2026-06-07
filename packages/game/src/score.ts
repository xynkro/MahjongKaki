// Scoring bridge: turns a finished/claimable GameState position into an engine
// ScoringResult. Decomposes the winner's concealed tiles into melds+pair, tries
// every legal decomposition, and keeps the highest-scoring one. Also used to
// gate wins by the minimum-tai rule (a 0-tai "chicken" hand cannot win in SG).

import {
  scoreHand,
  type Hand, type Meld, type WinContext, type Wind, type ScoringResult,
  type BonusTile, type FlowerTile, type SeasonTile, type AnimalTile, type Suit,
  indexToTile, pung, chow, eyes, WINDS, DEFAULT_RULES, type RulesConfig,
} from '@mahjongkaki/engine';
import { canWin, decomposeWinningHand } from './win-detect.js';
import type { GameState } from './game-state.js';

export function seatWindForSeat(seat: number, dealerSeat: number): Wind {
  return WINDS[(seat - dealerSeat + 4) % 4];
}

function splitBonus(bonus: BonusTile[]): {
  flowers: FlowerTile[]; seasons: SeasonTile[]; animals: AnimalTile[];
} {
  const flowers: FlowerTile[] = [];
  const seasons: SeasonTile[] = [];
  const animals: AnimalTile[] = [];
  for (const b of bonus) {
    if (b.kind === 'flower') flowers.push(b);
    else if (b.kind === 'season') seasons.push(b);
    else animals.push(b);
  }
  return { flowers, seasons, animals };
}

function suitOf(idx: number): Suit {
  return idx < 9 ? 'bamboo' : idx < 18 ? 'character' : 'dot';
}

// Score a complete hand (concealed tiles + exposed melds + bonus). Returns the
// best-scoring decomposition, or null if the concealed tiles can't form a
// standard winning shape (e.g. seven pairs, which SG scoring doesn't support).
export function scoreWinningHand(
  concealed: number[],
  exposed: Meld[],
  bonus: BonusTile[],
  seatWind: Wind,
  prevailingWind: Wind,
  winType: 'zimo' | 'discard',
  winTileIdx: number,
  rules: RulesConfig = DEFAULT_RULES,
): ScoringResult | null {
  const decomps = decomposeWinningHand(concealed);
  if (decomps.length === 0) return null;

  const { flowers, seasons, animals } = splitBonus(bonus);
  const ctx: WinContext = {
    seatWind, prevailingWind, winType,
    winTile: indexToTile(winTileIdx),
    isKongReplacement: false, isLastTile: false, isRobbingKong: false,
  };

  let best: ScoringResult | null = null;
  for (const d of decomps) {
    const concealedMelds: Meld[] = d.melds.map(m => {
      const t0 = m.tiles[0];
      if (m.type === 'pung') return pung(indexToTile(t0), false);
      return chow(suitOf(t0), ((t0 % 9) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7, false);
    });
    const hand: Hand = {
      melds: [...exposed, ...concealedMelds, eyes(indexToTile(d.pair))],
      flowers, seasons, animals,
    };
    const res = scoreHand(hand, ctx, rules);
    if (!best || res.cappedTai > best.cappedTai) best = res;
  }
  return best;
}

// Score the actual winner of a finished game.
export function scoreWinForSeat(state: GameState, seat: number): ScoringResult | null {
  const concealed = state.hands[seat];
  const winTileIdx =
    state.winType === 'discard' && state.lastDiscard
      ? state.lastDiscard.tile
      : concealed[concealed.length - 1] ?? 0;
  return scoreWinningHand(
    concealed, state.melds[seat], state.flowers[seat],
    seatWindForSeat(seat, state.dealerSeat), state.prevailingWind,
    state.winType ?? 'zimo', winTileIdx, state.rules,
  );
}

// True if `seat` can legally declare a self-drawn (tsumo) win right now:
// structurally complete AND meets the minimum-tai rule.
export function canDeclareTsumo(state: GameState, seat: number): boolean {
  if (!canWin(state.hands[seat], state.melds[seat])) return false;
  const res = scoreWinForSeat({ ...state, winType: 'zimo' }, seat);
  return res !== null && res.isValid;
}

// True if claiming `discardTile` for the win would be a legal (tai-valid) win.
export function isDiscardWinValid(
  hand: number[],
  melds: Meld[],
  bonus: BonusTile[],
  seatWind: Wind,
  prevailingWind: Wind,
  discardTile: number,
): boolean {
  if (!canWin([...hand, discardTile], melds)) return false;
  const res = scoreWinningHand(
    [...hand, discardTile], melds, bonus, seatWind, prevailingWind, 'discard', discardTile,
  );
  return res !== null && res.isValid;
}
