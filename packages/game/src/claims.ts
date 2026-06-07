import { type BonusTile, type Wind, type Meld } from '@mahjongkaki/engine';
import { canWin } from './win-detect.js';
import { isDiscardWinValid, seatWindForSeat } from './score.js';

export type ClaimType = 'win' | 'kong' | 'pung' | 'chow';

export interface Claim {
  player: number;
  claimType: ClaimType;
  tile: number;
  tilesFromHand: number[];
  priority: number;
}

// Extra context needed to validate a discard-win against the minimum-tai rule.
// Optional so structural callers/tests can omit it (wins are then gated only by shape).
export interface ClaimWinContext {
  flowers: BonusTile[][];
  dealerSeat: number;
  prevailingWind: Wind;
}

export function getAvailableClaims(
  hands: number[][],
  melds: Meld[][],
  discardTile: number,
  discardPlayer: number,
  currentPlayerOrder: number[],
  winCtx?: ClaimWinContext,
): Claim[] {
  const claims: Claim[] = [];

  for (let seat = 0; seat < 4; seat++) {
    if (seat === discardPlayer) continue;

    const hand = hands[seat];
    const playerMelds = melds[seat];

    const winnable = winCtx
      ? isDiscardWinValid(
          hand, playerMelds, winCtx.flowers[seat],
          seatWindForSeat(seat, winCtx.dealerSeat), winCtx.prevailingWind, discardTile,
        )
      : canWin([...hand, discardTile], playerMelds);

    if (winnable) {
      claims.push({
        player: seat,
        claimType: 'win',
        tile: discardTile,
        tilesFromHand: [],
        priority: 0,
      });
    }

    const countInHand = hand.filter(t => t === discardTile).length;

    if (countInHand >= 3) {
      claims.push({
        player: seat,
        claimType: 'kong',
        tile: discardTile,
        tilesFromHand: [discardTile, discardTile, discardTile],
        priority: 1,
      });
    }

    if (countInHand >= 2) {
      claims.push({
        player: seat,
        claimType: 'pung',
        tile: discardTile,
        tilesFromHand: [discardTile, discardTile],
        priority: 1,
      });
    }

    const nextSeat = (discardPlayer + 1) % 4;
    if (seat === nextSeat && discardTile < 27) {
      const suitStart = Math.floor(discardTile / 9) * 9;
      const val = discardTile - suitStart;
      const chowPatterns: [number, number][] = [];

      if (val >= 2) {
        const a = discardTile - 2;
        const b = discardTile - 1;
        if (hand.includes(a) && hand.includes(b)) {
          chowPatterns.push([a, b]);
        }
      }
      if (val >= 1 && val <= 7) {
        const a = discardTile - 1;
        const b = discardTile + 1;
        if (hand.includes(a) && hand.includes(b)) {
          chowPatterns.push([a, b]);
        }
      }
      if (val <= 6) {
        const a = discardTile + 1;
        const b = discardTile + 2;
        if (hand.includes(a) && hand.includes(b)) {
          chowPatterns.push([a, b]);
        }
      }

      for (const [a, b] of chowPatterns) {
        claims.push({
          player: seat,
          claimType: 'chow',
          tile: discardTile,
          tilesFromHand: [a, b],
          priority: 2,
        });
      }
    }
  }

  claims.sort((a, b) => a.priority - b.priority);
  return claims;
}

export function resolveClaims(claims: Claim[]): Claim | null {
  if (claims.length === 0) return null;
  const sorted = [...claims].sort((a, b) => a.priority - b.priority);
  return sorted[0];
}
