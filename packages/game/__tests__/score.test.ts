import { describe, it, expect } from 'vitest';
import {
  scoreWinningHand, canDeclareTsumo, isDiscardWinValid, detectHandFromTiles,
  type GameState,
} from '../src/index.js';
import { DEFAULT_RULES } from '@mahjongkaki/engine';

// A concealed full-flush bamboo win: pair b1 + chow 1-2-3 + chow 4-5-6 + chow 7-8-9 + pung b9.
// indices: b1=0..b9=8.
const FULL_FLUSH = [0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8];
// b111 222 333 + d789 + c55: three pungs, or three 1-2-3 chows.
const TWO_READINGS = [0, 0, 0, 1, 1, 1, 2, 2, 2, 24, 25, 26, 13, 13];

function fakeState(hand: number[]): GameState {
  return {
    hands: [hand, [], [], []],
    melds: [[], [], [], []],
    flowers: [[], [], [], []],
    discards: [[], [], [], []],
    dealerSeat: 0,
    prevailingWind: 'east',
    winType: null,
    lastDiscard: null,
  } as unknown as GameState;
}

describe('scoreWinningHand', () => {
  it('scores a concealed full flush as a valid, high-tai hand', () => {
    const res = scoreWinningHand(FULL_FLUSH, [], [], 'east', 'east', 'zimo', 0);
    expect(res).not.toBeNull();
    expect(res!.isValid).toBe(true);
    expect(res!.elements.some(e => e.id === 'full_flush')).toBe(true);
    expect(res!.cappedTai).toBe(5); // 4 (full flush) + 1 (concealed) + 1 (no flowers), capped at 5
  });

  it('returns null for tiles that do not form a standard winning shape', () => {
    // seven honour pairs (E S W N + 3 dragons) — no chows/pungs possible, unsupported in SG
    const notAWin = [27, 27, 28, 28, 29, 29, 30, 30, 31, 31, 32, 32, 33, 33];
    expect(scoreWinningHand(notAWin, [], [], 'east', 'east', 'zimo', 0)).toBeNull();
  });

  it('keeps the higher-scoring reading when a hand splits two ways', () => {
    // Concealed, the chow reading earns Ping Wu; the pung reading (tried first) does not.
    const res = scoreWinningHand(TWO_READINGS, [], [], 'east', 'east', 'zimo', 0);
    expect(res!.elements.some(e => e.id === 'ping_wu')).toBe(true);
  });
});

describe('detectHandFromTiles', () => {
  const ctx = {
    seatWind: 'east', prevailingWind: 'east', winType: 'discard',
    isKongReplacement: false, isLastTile: false, isRobbingKong: false,
  } as const;
  const noBonus = { flowers: [], seasons: [], animals: [] };

  it('turns 14 tiles into 4 sets + eyes', () => {
    const res = detectHandFromTiles(FULL_FLUSH, { concealed: true, bonus: noBonus, ctx });
    expect(res!.melds.filter(m => m.type === 'eyes')).toHaveLength(1);
    expect(res!.melds.filter(m => m.type !== 'eyes')).toHaveLength(4);
    expect(res!.scoring.elements.some(e => e.id === 'full_flush')).toBe(true);
  });

  it('picks the best reading and says how many it compared', () => {
    const res = detectHandFromTiles(TWO_READINGS, { concealed: true, bonus: noBonus, ctx });
    expect(res!.readings).toBe(2);
    expect(res!.melds.filter(m => m.type === 'pung')).toHaveLength(0);
    expect(res!.scoring.elements.some(e => e.id === 'ping_wu')).toBe(true);
  });

  it('gives no concealed credit unless the player says the hand was concealed', () => {
    const res = detectHandFromTiles(TWO_READINGS, { concealed: false, bonus: noBonus, ctx });
    expect(res!.melds.filter(m => m.type !== 'eyes').every(m => m.exposed)).toBe(true);
    const ids = res!.scoring.elements.map(e => e.id);
    expect(ids).not.toContain('concealed_hand');
    expect(ids).not.toContain('ping_wu');
  });

  it('re-picks the reading when a flower removes Ping Wu', () => {
    const withFlower = {
      flowers: [{ kind: 'flower', flower: 'plum' }], seasons: [], animals: [],
    } as unknown as typeof noBonus;
    const res = detectHandFromTiles(TWO_READINGS, { concealed: true, bonus: withFlower, ctx });
    expect(res!.scoring.elements.map(e => e.id)).not.toContain('ping_wu');
  });

  it('returns null for anything but a complete 14-tile standard hand', () => {
    expect(detectHandFromTiles(FULL_FLUSH.slice(0, 13), { concealed: true, bonus: noBonus, ctx })).toBeNull();
    const sevenPairs = [27, 27, 28, 28, 29, 29, 30, 30, 31, 31, 32, 32, 33, 33];
    expect(detectHandFromTiles(sevenPairs, { concealed: true, bonus: noBonus, ctx })).toBeNull();
  });
});

describe('canDeclareTsumo', () => {
  it('is true for a complete, tai-valid concealed hand', () => {
    expect(canDeclareTsumo(fakeState(FULL_FLUSH), 0)).toBe(true);
  });

  it('is false when the hand is not structurally complete', () => {
    const incomplete = [0, 2, 4, 6, 8, 9, 11, 13, 15, 17, 19, 21, 23, 25];
    expect(canDeclareTsumo(fakeState(incomplete), 0)).toBe(false);
  });
});

describe('isDiscardWinValid', () => {
  it('is true when the discard completes a tai-valid hand', () => {
    // 13 tiles waiting on b1 to complete FULL_FLUSH
    const waiting = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8];
    expect(isDiscardWinValid(waiting, [], [], 'east', 'east', 0)).toBe(true);
  });

  it('is false when the discard does not complete the hand', () => {
    const waiting = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8];
    expect(isDiscardWinValid(waiting, [], [], 'east', 'east', 20)).toBe(false);
  });

  it('respects a custom minimum-tai rule', () => {
    // completes to a 5-tai full flush on b1 (index 0)
    const waiting = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8];
    // minimum above the hand's tai → not a legal win
    expect(isDiscardWinValid(waiting, [], [], 'east', 'east', 0, { ...DEFAULT_RULES, minTai: 6 })).toBe(false);
    // minimum at the hand's tai → legal
    expect(isDiscardWinValid(waiting, [], [], 'east', 'east', 0, { ...DEFAULT_RULES, minTai: 5 })).toBe(true);
  });
});
