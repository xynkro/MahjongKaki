import { describe, it, expect } from 'vitest';
import { tileToIndex, suit, wind, dragon } from '@mahjongkaki/engine';
import { getAvailableClaims, resolveClaims } from '../src/claims.js';

const t = tileToIndex;

function hand(...tiles: Parameters<typeof tileToIndex>[0][]): number[] {
  return tiles.map(t);
}

describe('getAvailableClaims', () => {
  it('detects win claim', () => {
    const hands = [
      hand(
        suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
        suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6),
        suit('bamboo', 7), suit('bamboo', 8), suit('bamboo', 9),
        suit('character', 1), suit('character', 1), suit('character', 1),
        suit('dot', 5),
      ),
      hand(suit('dot', 1), suit('dot', 2), suit('dot', 3), suit('dot', 4), suit('dot', 5),
        suit('dot', 6), suit('dot', 7), suit('dot', 8), suit('dot', 9),
        suit('character', 2), suit('character', 2), suit('character', 2), suit('character', 3)),
      hand(suit('bamboo', 1), suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 2),
        suit('bamboo', 3), suit('bamboo', 3), suit('bamboo', 4), suit('bamboo', 4),
        suit('bamboo', 5), suit('bamboo', 5), suit('bamboo', 6), suit('bamboo', 6),
        suit('bamboo', 7)),
      hand(suit('dot', 1), suit('dot', 2), suit('dot', 3), suit('dot', 4), suit('dot', 5),
        suit('dot', 6), suit('dot', 7), suit('dot', 8), suit('dot', 9),
        suit('character', 3), suit('character', 3), suit('character', 3), suit('character', 4)),
    ];
    const melds = [[], [], [], []];
    const discardTile = t(suit('dot', 5));
    const claims = getAvailableClaims(hands, melds, discardTile, 1, [0, 1, 2, 3]);

    const winClaims = claims.filter(c => c.claimType === 'win');
    expect(winClaims.length).toBeGreaterThanOrEqual(1);
    expect(winClaims[0].player).toBe(0);
  });

  it('detects pung claim', () => {
    const hands = [
      hand(suit('bamboo', 1), suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
        suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6), suit('bamboo', 7),
        suit('bamboo', 8), suit('bamboo', 9), suit('character', 1), suit('character', 2),
        suit('character', 3)),
      [], [], [],
    ];
    const melds = [[], [], [], []];
    const claims = getAvailableClaims(hands, melds, t(suit('bamboo', 1)), 2, [0, 1, 2, 3]);
    const pungClaims = claims.filter(c => c.claimType === 'pung');
    expect(pungClaims.length).toBe(1);
    expect(pungClaims[0].player).toBe(0);
  });

  it('detects chow claim only from next seat', () => {
    const hands = [
      hand(suit('bamboo', 2), suit('bamboo', 3), suit('bamboo', 4), suit('bamboo', 5),
        suit('bamboo', 6), suit('bamboo', 7), suit('bamboo', 8), suit('bamboo', 9),
        suit('character', 1), suit('character', 2), suit('character', 3),
        suit('dot', 5), suit('dot', 5)),
      [],
      hand(suit('bamboo', 2), suit('bamboo', 3), suit('bamboo', 4), suit('bamboo', 5),
        suit('bamboo', 6), suit('bamboo', 7), suit('bamboo', 8), suit('bamboo', 9),
        suit('character', 1), suit('character', 2), suit('character', 3),
        suit('dot', 5), suit('dot', 5)),
      [],
    ];
    const melds = [[], [], [], []];
    // Player 3 discards bamboo 1. Next seat is player 0.
    const claims = getAvailableClaims(hands, melds, t(suit('bamboo', 1)), 3, [0, 1, 2, 3]);
    const chowClaims = claims.filter(c => c.claimType === 'chow');
    expect(chowClaims.length).toBeGreaterThan(0);
    expect(chowClaims.every(c => c.player === 0)).toBe(true);
  });

  it('win has higher priority than pung', () => {
    const claims = [
      { player: 0, claimType: 'pung' as const, tile: 0, tilesFromHand: [0, 0], priority: 1 },
      { player: 2, claimType: 'win' as const, tile: 0, tilesFromHand: [], priority: 0 },
    ];
    const resolved = resolveClaims(claims);
    expect(resolved?.claimType).toBe('win');
  });

  it('pung has higher priority than chow', () => {
    const claims = [
      { player: 1, claimType: 'chow' as const, tile: 5, tilesFromHand: [3, 4], priority: 2 },
      { player: 2, claimType: 'pung' as const, tile: 5, tilesFromHand: [5, 5], priority: 1 },
    ];
    const resolved = resolveClaims(claims);
    expect(resolved?.claimType).toBe('pung');
  });

  it('returns null when no claims', () => {
    expect(resolveClaims([])).toBeNull();
  });
});
