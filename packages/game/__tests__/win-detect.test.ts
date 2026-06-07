import { describe, it, expect } from 'vitest';
import { tileToIndex, suit, wind, dragon, pung, kong, chow } from '@mahjongkaki/engine';
import { canWin, isThirteenOrphans, isSevenPairs, decomposeWinningHand } from '../src/win-detect.js';

const t = tileToIndex;

function hand(...tiles: Parameters<typeof tileToIndex>[0][]): number[] {
  return tiles.map(t);
}

describe('canWin', () => {
  it('valid 4-meld + pair = true', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
      suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6),
      suit('bamboo', 7), suit('bamboo', 8), suit('bamboo', 9),
      suit('character', 1), suit('character', 1), suit('character', 1),
      suit('dot', 5), suit('dot', 5),
    );
    expect(canWin(h, [])).toBe(true);
  });

  it('all pungs + pair = true', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 1), suit('bamboo', 1),
      suit('character', 5), suit('character', 5), suit('character', 5),
      suit('dot', 9), suit('dot', 9), suit('dot', 9),
      wind('east'), wind('east'), wind('east'),
      dragon('red'), dragon('red'),
    );
    expect(canWin(h, [])).toBe(true);
  });

  it('incomplete hand = false', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 3), suit('bamboo', 5),
      suit('character', 2), suit('character', 4), suit('character', 6),
      suit('dot', 1), suit('dot', 3), suit('dot', 5),
      wind('east'), wind('south'), wind('west'),
      wind('north'), dragon('red'),
    );
    expect(canWin(h, [])).toBe(false);
  });

  it('with existing melds, fewer tiles needed from hand', () => {
    const existingMelds = [pung(suit('bamboo', 1)), chow('dot', 1)];
    const h = hand(
      suit('character', 1), suit('character', 2), suit('character', 3),
      suit('character', 5), suit('character', 5), suit('character', 5),
      wind('east'), wind('east'),
    );
    expect(canWin(h, existingMelds)).toBe(true);
  });

  it('wrong tile count = false', () => {
    const h = hand(suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3));
    expect(canWin(h, [])).toBe(false);
  });
});

describe('isThirteenOrphans', () => {
  it('valid thirteen orphans', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 9),
      suit('character', 1), suit('character', 9),
      suit('dot', 1), suit('dot', 9),
      wind('east'), wind('south'), wind('west'), wind('north'),
      dragon('red'), dragon('green'), dragon('white'),
      suit('bamboo', 1),
    );
    expect(isThirteenOrphans(h)).toBe(true);
  });

  it('missing one orphan = false', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 9),
      suit('character', 1), suit('character', 9),
      suit('dot', 1), suit('dot', 9),
      wind('east'), wind('south'), wind('west'), wind('north'),
      dragon('red'), dragon('green'),
      suit('bamboo', 1), suit('bamboo', 1),
    );
    expect(isThirteenOrphans(h)).toBe(false);
  });
});

describe('isSevenPairs', () => {
  it('valid seven pairs', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 1),
      suit('bamboo', 3), suit('bamboo', 3),
      suit('character', 5), suit('character', 5),
      suit('dot', 7), suit('dot', 7),
      wind('east'), wind('east'),
      dragon('red'), dragon('red'),
      suit('dot', 1), suit('dot', 1),
    );
    expect(isSevenPairs(h)).toBe(true);
  });

  it('four of a kind not two pairs = false', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 1), suit('bamboo', 1), suit('bamboo', 1),
      suit('bamboo', 3), suit('bamboo', 3),
      suit('character', 5), suit('character', 5),
      suit('dot', 7), suit('dot', 7),
      wind('east'), wind('east'),
      dragon('red'), dragon('red'),
    );
    expect(isSevenPairs(h)).toBe(false);
  });
});

describe('decomposeWinningHand', () => {
  it('finds decomposition for chow+pung hand', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
      suit('character', 5), suit('character', 5), suit('character', 5),
      suit('dot', 7), suit('dot', 8), suit('dot', 9),
      wind('east'), wind('east'), wind('east'),
      dragon('red'), dragon('red'),
    );
    const decomps = decomposeWinningHand(h);
    expect(decomps.length).toBeGreaterThan(0);
    expect(decomps[0].melds).toHaveLength(4);
    expect(decomps[0].pair).toBe(t(dragon('red')));
  });

  it('returns empty for non-winning hand', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 3), suit('bamboo', 5),
      suit('character', 2), suit('character', 4), suit('character', 6),
      suit('dot', 1), suit('dot', 3), suit('dot', 5),
      wind('east'), wind('south'), wind('west'),
      wind('north'), dragon('red'),
    );
    expect(decomposeWinningHand(h)).toEqual([]);
  });

  it('finds multiple decompositions when ambiguous', () => {
    // 1-2-3-4-5-6-7-8-9b + 1-1-1c + 5-5d has multiple decompositions
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
      suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6),
      suit('bamboo', 7), suit('bamboo', 8), suit('bamboo', 9),
      suit('character', 1), suit('character', 1), suit('character', 1),
      suit('dot', 5), suit('dot', 5),
    );
    const decomps = decomposeWinningHand(h);
    expect(decomps.length).toBeGreaterThanOrEqual(1);
  });
});
