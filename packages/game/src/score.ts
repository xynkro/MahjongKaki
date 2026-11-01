// Scoring bridge: turns a finished/claimable GameState position into an engine
// ScoringResult. Decomposes the winner's concealed tiles into melds+pair, tries
// every legal decomposition, and keeps the highest-scoring one. Also used to
// gate wins by the minimum-tai rule (a 0-tai "chicken" hand cannot win in SG).

import {
  scoreHand,
  type Hand, type Meld, type WinContext, type Wind, type ScoringResult,
  type BonusTile, type FlowerTile, type SeasonTile, type AnimalTile, type Suit,
  indexToTile, pung, chow, eyes, thirteenWonders, WINDS, DEFAULT_RULES, type RulesConfig,
} from '@mahjongkaki/engine';
import { canWin, decomposeWinningHand, isThirteenOrphans, type WinDecomposition } from './win-detect.js';
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

function wondersMeld(tiles: number[]): Meld | null {
  if (!isThirteenOrphans(tiles)) return null;
  const pair = tiles.find((t, i) => tiles.indexOf(t) !== i)!;
  return thirteenWonders(indexToTile(pair));
}

// Score a complete hand (concealed tiles + exposed melds + bonus). Returns Thirteen
// Wonders or the best-scoring decomposition, or null if the concealed tiles can't
// form a winning shape (e.g. seven pairs, which SG scoring doesn't support).
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
  const { flowers, seasons, animals } = splitBonus(bonus);
  const ctx: WinContext = {
    seatWind, prevailingWind, winType,
    winTile: indexToTile(winTileIdx),
    isKongReplacement: false, isLastTile: false, isRobbingKong: false,
  };

  const wonders = exposed.length === 0 ? wondersMeld(concealed) : null;
  if (wonders) return scoreHand({ melds: [wonders], flowers, seasons, animals }, ctx, rules);

  const decomps = decomposeWinningHand(concealed);
  if (decomps.length === 0) return null;

  let best: ScoringResult | null = null;
  for (const d of decomps) {
    const hand: Hand = {
      melds: [...exposed, ...decompToMelds(d, false)],
      flowers, seasons, animals,
    };
    const res = scoreHand(hand, ctx, rules);
    if (!best || res.cappedTai > best.cappedTai) best = res;
  }
  return best;
}

function decompToMelds(d: WinDecomposition, exposed: boolean): Meld[] {
  const sets: Meld[] = d.melds.map(m => {
    const t0 = m.tiles[0];
    if (m.type === 'pung') return pung(indexToTile(t0), exposed);
    return chow(suitOf(t0), ((t0 % 9) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7, exposed);
  });
  return [...sets, eyes(indexToTile(d.pair))];
}

export interface DetectedHand {
  melds: Meld[];
  scoring: ScoringResult;
  /** How many legal ways the tiles could be read as a hand. */
  readings: number;
}

// Calculator quick entry: read a flat list of 14 tiles as the best-scoring 4 sets
// + a pair. Tiles alone don't say what was exposed, and a concealed hand scores
// more, so `concealed` must come from the player. Thirteen Wonders is the exception:
// it has no sets to expose, so it is always concealed. Kongs can't be inferred (a
// kong hand holds more than 14 tiles).
export function detectHandFromTiles(
  tiles: number[],
  opts: {
    concealed: boolean;
    bonus: Pick<Hand, 'flowers' | 'seasons' | 'animals'>;
    ctx: Omit<WinContext, 'winTile'>;
    rules?: RulesConfig;
  },
): DetectedHand | null {
  if (tiles.length !== 14) return null;

  const wonders = wondersMeld(tiles);
  if (wonders) {
    const scoring = scoreHand(
      { melds: [wonders], ...opts.bonus },
      { ...opts.ctx, winTile: wonders.tiles[0] },
      opts.rules ?? DEFAULT_RULES,
    );
    return { melds: [wonders], scoring, readings: 1 };
  }

  const decomps = decomposeWinningHand(tiles);

  let best: DetectedHand | null = null;
  for (const d of decomps) {
    const melds = decompToMelds(d, !opts.concealed);
    const scoring = scoreHand(
      { melds, ...opts.bonus },
      { ...opts.ctx, winTile: indexToTile(d.pair) },
      opts.rules ?? DEFAULT_RULES,
    );
    const beats = !best
      || scoring.cappedTai > best.scoring.cappedTai
      || (scoring.cappedTai === best.scoring.cappedTai && scoring.totalTai > best.scoring.totalTai);
    if (beats) best = { melds, scoring, readings: decomps.length };
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
  rules: RulesConfig = DEFAULT_RULES,
): boolean {
  if (!canWin([...hand, discardTile], melds)) return false;
  const res = scoreWinningHand(
    [...hand, discardTile], melds, bonus, seatWind, prevailingWind, 'discard', discardTile, rules,
  );
  return res !== null && res.isValid;
}
