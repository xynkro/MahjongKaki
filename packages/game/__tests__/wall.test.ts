import { describe, it, expect } from 'vitest';
import {
  tileToIndex, indexToTile, tileKey, allPlayTiles,
  suit, wind, dragon,
} from '@mahjongkaki/engine';
import { createWallTiles, shuffleWall, dealInitial } from '../src/wall.js';

describe('tileToIndex / indexToTile', () => {
  it('round-trips all 34 play tiles', () => {
    const tiles = allPlayTiles();
    expect(tiles).toHaveLength(34);
    for (let i = 0; i < 34; i++) {
      expect(tileToIndex(tiles[i])).toBe(i);
      const rt = indexToTile(i);
      expect(tileToIndex(rt)).toBe(i);
    }
  });

  it('maps suit tiles correctly', () => {
    expect(tileToIndex(suit('bamboo', 1))).toBe(0);
    expect(tileToIndex(suit('bamboo', 9))).toBe(8);
    expect(tileToIndex(suit('character', 1))).toBe(9);
    expect(tileToIndex(suit('dot', 9))).toBe(26);
  });

  it('maps honour tiles correctly', () => {
    expect(tileToIndex(wind('east'))).toBe(27);
    expect(tileToIndex(wind('north'))).toBe(30);
    expect(tileToIndex(dragon('red'))).toBe(31);
    expect(tileToIndex(dragon('white'))).toBe(33);
  });
});

describe('tileKey', () => {
  it('produces unique keys for all play tiles', () => {
    const keys = allPlayTiles().map(tileKey);
    expect(new Set(keys).size).toBe(34);
  });

  it('produces readable keys', () => {
    expect(tileKey(suit('bamboo', 1))).toBe('b1');
    expect(tileKey(suit('character', 5))).toBe('c5');
    expect(tileKey(suit('dot', 9))).toBe('d9');
    expect(tileKey(wind('east'))).toBe('we');
    expect(tileKey(dragon('red'))).toBe('dr');
  });
});

describe('createWallTiles', () => {
  it('creates 148 tiles total (136 play + 12 bonus)', () => {
    const wall = createWallTiles();
    expect(wall).toHaveLength(148);
  });

  it('has exactly 4 copies of each play tile', () => {
    const wall = createWallTiles();
    const playTiles = wall.filter(w => !w.isBonus);
    expect(playTiles).toHaveLength(136);

    const counts = new Map<number, number>();
    for (const wt of playTiles) {
      const idx = tileToIndex(wt.tile as any);
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
    expect(counts.size).toBe(34);
    for (const [, count] of counts) {
      expect(count).toBe(4);
    }
  });

  it('has 12 unique bonus tiles', () => {
    const wall = createWallTiles();
    const bonus = wall.filter(w => w.isBonus);
    expect(bonus).toHaveLength(12);
  });

  it('includes 4 animal bonus tiles by default', () => {
    const wall = createWallTiles();
    const animals = wall.filter(w => w.isBonus && (w.tile as any).kind === 'animal');
    expect(animals).toHaveLength(4);
  });

  it('excludes animals when animals: false (144 tiles, 8 bonus, 0 animals)', () => {
    const wall = createWallTiles({ animals: false });
    expect(wall).toHaveLength(144);

    const play = wall.filter(w => !w.isBonus);
    const bonus = wall.filter(w => w.isBonus);
    expect(play).toHaveLength(136);
    expect(bonus).toHaveLength(8);

    const animals = bonus.filter(w => (w.tile as any).kind === 'animal');
    expect(animals).toHaveLength(0);
  });

  it('keeps 136 play tiles regardless of the animals rule', () => {
    const withAnimals = createWallTiles({ animals: true }).filter(w => !w.isBonus);
    const withoutAnimals = createWallTiles({ animals: false }).filter(w => !w.isBonus);
    expect(withAnimals).toHaveLength(136);
    expect(withoutAnimals).toHaveLength(136);
  });
});

describe('shuffleWall', () => {
  it('preserves all tiles', () => {
    const wall = createWallTiles();
    const shuffled = shuffleWall(wall);
    expect(shuffled).toHaveLength(wall.length);

    const originalIndices = wall.map(w => w.index).sort((a, b) => a - b);
    const shuffledIndices = shuffled.map(w => w.index).sort((a, b) => a - b);
    expect(shuffledIndices).toEqual(originalIndices);
  });

  it('does not mutate the original', () => {
    const wall = createWallTiles();
    const firstIdx = wall[0].index;
    shuffleWall(wall);
    expect(wall[0].index).toBe(firstIdx);
  });
});

describe('dealInitial', () => {
  it('gives dealer 14 play tiles and others 13', () => {
    const wall = shuffleWall(createWallTiles());
    const result = dealInitial(wall, 0);

    const totalPlay = result.hands.reduce((sum, h) => sum + h.hand.length, 0);
    const totalBonus = result.hands.reduce((sum, h) => sum + h.bonusTiles.length, 0);

    expect(result.hands[0].hand.length).toBe(14);
    for (let i = 1; i < 4; i++) {
      expect(result.hands[i].hand.length).toBe(13);
    }

    const wallPlayRemaining = result.remainingWall.filter(w => !w.isBonus).length;
    const wallBonusRemaining = result.remainingWall.filter(w => w.isBonus).length;
    const deadPlayRemaining = result.deadWall.filter(w => !w.isBonus).length;
    const deadBonusRemaining = result.deadWall.filter(w => w.isBonus).length;

    expect(
      totalPlay + totalBonus + wallPlayRemaining + wallBonusRemaining + deadPlayRemaining + deadBonusRemaining
    ).toBe(148);
  });

  it('deals correctly with animals disabled (144-tile wall, bonus replacement intact)', () => {
    const wall = shuffleWall(createWallTiles({ animals: false }));
    const result = dealInitial(wall, 0);

    expect(result.hands[0].hand.length).toBe(14);
    for (let i = 1; i < 4; i++) {
      expect(result.hands[i].hand.length).toBe(13);
    }

    // No animal can ever surface as a bonus tile.
    for (const h of result.hands) {
      for (const bt of h.bonusTiles) {
        expect((bt as any).kind).not.toBe('animal');
      }
    }

    const totalPlay = result.hands.reduce((sum, h) => sum + h.hand.length, 0);
    const totalBonus = result.hands.reduce((sum, h) => sum + h.bonusTiles.length, 0);
    const wallRemaining = result.remainingWall.length;
    const deadRemaining = result.deadWall.length;
    expect(totalPlay + totalBonus + wallRemaining + deadRemaining).toBe(144);
  });

  it('works with non-zero dealer seat', () => {
    const wall = shuffleWall(createWallTiles());
    const result = dealInitial(wall, 2);

    expect(result.hands[2].hand.length).toBe(14);
    expect(result.hands[0].hand.length).toBe(13);
    expect(result.hands[1].hand.length).toBe(13);
    expect(result.hands[3].hand.length).toBe(13);
  });

  it('separates bonus tiles from play tiles', () => {
    const wall = shuffleWall(createWallTiles());
    const result = dealInitial(wall, 0);

    for (const h of result.hands) {
      for (const tileIdx of h.hand) {
        expect(tileIdx).toBeGreaterThanOrEqual(0);
        expect(tileIdx).toBeLessThan(34);
      }
    }
  });

  it('no duplicate tiles across all hands + wall + dead wall', () => {
    const wall = shuffleWall(createWallTiles());
    const result = dealInitial(wall, 0);

    const allIndices: number[] = [];
    for (const h of result.hands) {
      allIndices.push(...h.hand);
    }

    const counts = new Map<number, number>();
    for (const idx of allIndices) {
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
    for (const [, count] of counts) {
      expect(count).toBeLessThanOrEqual(4);
    }
  });
});
