import { describe, it, expect } from 'vitest';
import { tileToIndex, suit, wind, dragon } from '@mahjongkaki/engine';
import { shanten, tenpaiWaits, ukeire } from '../src/shanten.js';

const t = tileToIndex;

function hand(...tiles: Parameters<typeof tileToIndex>[0][]): number[] {
  return tiles.map(t);
}

describe('shanten', () => {
  it('complete hand (14 tiles) = -1', () => {
    // 1-2-3b 4-5-6b 7-8-9b 1-1-1c 5-5d (4 melds + pair)
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
      suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6),
      suit('bamboo', 7), suit('bamboo', 8), suit('bamboo', 9),
      suit('character', 1), suit('character', 1), suit('character', 1),
      suit('dot', 5), suit('dot', 5),
    );
    expect(shanten(h)).toBe(-1);
  });

  it('tenpai (13 tiles, 1 away) = 0', () => {
    // 1-2-3b 4-5-6b 7-8-9b 1-1-1c 5d (needs pair)
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
      suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6),
      suit('bamboo', 7), suit('bamboo', 8), suit('bamboo', 9),
      suit('character', 1), suit('character', 1), suit('character', 1),
      suit('dot', 5),
    );
    expect(shanten(h)).toBe(0);
  });

  it('iishanten (2 away) = 1', () => {
    // 1-2-3b 4-5-6b 7-8b 1-1c 3-4d 9d (needs 2 tiles)
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
      suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6),
      suit('bamboo', 7), suit('bamboo', 8),
      suit('character', 1), suit('character', 1),
      suit('dot', 3), suit('dot', 4),
      suit('dot', 9),
    );
    expect(shanten(h)).toBe(1);
  });

  it('all pungs hand = -1 with 14 tiles', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 1), suit('bamboo', 1),
      suit('character', 5), suit('character', 5), suit('character', 5),
      suit('dot', 9), suit('dot', 9), suit('dot', 9),
      wind('east'), wind('east'), wind('east'),
      dragon('red'), dragon('red'),
    );
    expect(shanten(h)).toBe(-1);
  });

  it('seven pairs tenpai = 0', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 1),
      suit('bamboo', 3), suit('bamboo', 3),
      suit('character', 5), suit('character', 5),
      suit('dot', 7), suit('dot', 7),
      wind('east'), wind('east'),
      dragon('red'), dragon('red'),
      suit('dot', 1),
    );
    expect(shanten(h)).toBe(0);
  });

  it('thirteen orphans tenpai = 0', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 9),
      suit('character', 1), suit('character', 9),
      suit('dot', 1), suit('dot', 9),
      wind('east'), wind('south'), wind('west'), wind('north'),
      dragon('red'), dragon('green'),
      dragon('white'),
    );
    expect(shanten(h)).toBe(0);
  });

  it('thirteen orphans incomplete = correct shanten', () => {
    // missing 3 orphans
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 9),
      suit('character', 1), suit('character', 9),
      suit('dot', 1), suit('dot', 9),
      wind('east'), wind('south'), wind('west'),
      dragon('red'),
      suit('bamboo', 5), suit('bamboo', 6), suit('bamboo', 7),
    );
    const s = shanten(h);
    expect(s).toBeLessThanOrEqual(3);
  });
});

describe('tenpaiWaits', () => {
  it('finds single wait (tanki)', () => {
    // 1-2-3b 4-5-6b 7-8-9b 1-1-1c 5d → waits on 5d
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
      suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6),
      suit('bamboo', 7), suit('bamboo', 8), suit('bamboo', 9),
      suit('character', 1), suit('character', 1), suit('character', 1),
      suit('dot', 5),
    );
    const waits = tenpaiWaits(h);
    expect(waits).toContain(t(suit('dot', 5)));
    expect(waits.length).toBeGreaterThanOrEqual(1);
  });

  it('finds two-sided wait (ryanmen)', () => {
    // 1-2-3b 4-5-6b 7-8-9b 5-5c 2-3d → waits on 1d or 4d
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
      suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6),
      suit('bamboo', 7), suit('bamboo', 8), suit('bamboo', 9),
      suit('character', 5), suit('character', 5),
      suit('dot', 2), suit('dot', 3),
    );
    const waits = tenpaiWaits(h);
    expect(waits).toContain(t(suit('dot', 1)));
    expect(waits).toContain(t(suit('dot', 4)));
  });

  it('returns empty for non-tenpai hand', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 3), suit('bamboo', 5),
      suit('character', 2), suit('character', 4), suit('character', 6),
      suit('dot', 1), suit('dot', 3), suit('dot', 5),
      wind('east'), wind('south'), wind('west'), wind('north'),
    );
    expect(tenpaiWaits(h)).toEqual([]);
  });

  it('thirteen orphans waits on missing tile', () => {
    // has all 13 unique terminals/honours except dragon white
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 9),
      suit('character', 1), suit('character', 9),
      suit('dot', 1), suit('dot', 9),
      wind('east'), wind('south'), wind('west'), wind('north'),
      dragon('red'), dragon('green'),
      suit('bamboo', 1), // extra for pair
    );
    const waits = tenpaiWaits(h);
    expect(waits).toContain(t(dragon('white')));
  });
});

describe('ukeire', () => {
  it('returns results sorted by acceptance count', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
      suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6),
      suit('bamboo', 7), suit('bamboo', 8),
      suit('character', 1), suit('character', 1),
      suit('dot', 3), suit('dot', 4),
      suit('dot', 9),
    );
    const results = ukeire(h);
    expect(results.length).toBeGreaterThan(0);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].totalAcceptance).toBeLessThanOrEqual(results[i - 1].totalAcceptance);
    }
  });

  it('best discard reduces shanten', () => {
    const h = hand(
      suit('bamboo', 1), suit('bamboo', 2), suit('bamboo', 3),
      suit('bamboo', 4), suit('bamboo', 5), suit('bamboo', 6),
      suit('bamboo', 7), suit('bamboo', 8),
      suit('character', 1), suit('character', 1),
      suit('dot', 3), suit('dot', 4),
      suit('dot', 9),
      suit('character', 7),
    );
    const results = ukeire(h);
    expect(results[0].totalAcceptance).toBeGreaterThan(0);
  });
});
