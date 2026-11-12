import { describe, it, expect } from 'vitest';
import { createGame } from '@mahjongkaki/game';
import { dealtCount, DEAL_TOTAL, stacksFor, wallUsage, totalTiles, breakSeat } from '../src/components/game/Wall';

describe('wall picture', () => {
  it('deals 13 to everyone and 14 to the dealer', () => {
    for (let dealer = 0; dealer < 4; dealer++) {
      const counts = [0, 1, 2, 3].map(s => dealtCount(DEAL_TOTAL, s, dealer));
      expect(counts[dealer]).toBe(14);
      expect(counts.reduce((a, b) => a + b, 0)).toBe(53);
    }
    expect(dealtCount(4, 2, 2)).toBe(4);
    expect(dealtCount(4, 3, 2)).toBe(0);
  });

  it('builds 19/18/19/18 stacks with 148 tiles and 18 each with 144', () => {
    expect(['east', 'south', 'west', 'north'].map(w => stacksFor(w as never, 148))).toEqual([19, 18, 19, 18]);
    expect(stacksFor('east', 144)).toBe(18);
  });

  it('counts the dice round from the dealer, who is 1', () => {
    expect(breakSeat({ a: 1, b: 4 }, 0)).toBe(0); // 5 lands back on the dealer
    expect(breakSeat({ a: 3, b: 4 }, 1)).toBe(3); // 7 → third player after the dealer
  });

  it('accounts for every tile right after the deal', () => {
    const g = createGame();
    const u = wallUsage(g);
    const inHands = g.hands.reduce((a, h) => a + h.length, 0) + g.flowers.reduce((a, f) => a + f.length, 0);
    expect(u.front + u.back).toBe(inHands);
    expect(totalTiles(g) - g.wall.length - g.deadWall.length).toBe(inHands);
  });
});
