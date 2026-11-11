import { describe, it, expect } from 'vitest';
import { tileToIndex, suit, dragon, wind } from '@mahjongkaki/engine';
import { coachClaim, coachDiscard } from '../src/lib/coach';

type V = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
const b = (v: V) => tileToIndex(suit('bamboo', v));
const c = (v: V) => tileToIndex(suit('character', v));
const d = (v: V) => tileToIndex(suit('dot', v));
const RED = tileToIndex(dragon('red'));
const N = tileToIndex(wind('north'));
const W = tileToIndex(wind('west'));
const E = tileToIndex(wind('east'));

describe('coachClaim', () => {
  it('always takes a winning tile', () => {
    const tip = coachClaim([b(1)], [], [{ claimType: 'win', tile: b(1), tilesFromHand: [] }]);
    expect(tip?.pick).toBe(0);
  });

  it('takes a pung that moves the hand closer to ready', () => {
    const hand = [b(1), b(2), b(3), c(4), c(5), c(6), d(7), d(8), RED, RED, N, W, E];
    const tip = coachClaim(hand, [], [{ claimType: 'pung', tile: RED, tilesFromHand: [RED, RED] }]);
    expect(tip?.pick).toBe(0);
    expect(tip?.text).toMatch(/^Take the pung/);
  });

  it('skips a chow that only breaks up a set it already has', () => {
    const hand = [b(1), b(2), b(3), c(4), c(5), c(6), d(7), d(8), d(9), b(5), b(6), b(7), N];
    const tip = coachClaim(hand, [], [{ claimType: 'chow', tile: b(4), tilesFromHand: [b(5), b(6)] }]);
    expect(tip?.pick).toBeNull();
    expect(tip?.text).toMatch(/^Skip/);
  });
});

describe('coachDiscard', () => {
  it('throws a lone honour rather than breaking a finished set', () => {
    const hand = [b(1), b(2), b(3), c(4), c(5), c(6), d(7), d(8), d(9), b(5), b(6), b(7), N, W];
    const tip = coachDiscard(hand, [], []);
    expect([N, W]).toContain(tip?.tile);
    expect(tip?.text).toMatch(/^Throw the (North|West) wind/);
  });
});
