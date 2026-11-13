import { describe, it, expect } from 'vitest';
import { instantPayments, handNet, type GameState } from '../src/index.js';
import { DEFAULT_RULES, mergeRules, animal, flower, season, kong, suit, type BonusTile, type Meld } from '@mahjongkaki/engine';

const STAKE = { label: 'Points', base: 1, doubled: 2 };

function state(flowers: BonusTile[][], melds: Meld[][] = [[], [], [], []], rules = DEFAULT_RULES): GameState {
  return {
    hands: [[], [], [], []], melds, flowers, discards: [[], [], [], []],
    dealerSeat: 0, prevailingWind: 'east', winner: null, winType: null,
    lastDiscard: null, lastDraw: null, rules,
  } as unknown as GameState;
}

describe('instant payments', () => {
  it('pays a cat-and-rat bite from all three others, even when nobody wins', () => {
    const s = state([[animal('cat'), animal('rat')], [], [], []]);
    expect(instantPayments(s)).toEqual([{ seat: 0, reason: 'Cat catches rat', units: 2 }]);
    expect(handNet(s, STAKE)).toEqual([6, -2, -2, -2]);
  });

  it('a cat with a centipede is no bite', () => {
    expect(instantPayments(state([[animal('cat'), animal('centipede')], [], [], []]))).toEqual([]);
  });

  it('all four animals pays both bites plus the set', () => {
    const s = state([[], [animal('cat'), animal('rat'), animal('rooster'), animal('centipede')], [], []]);
    expect(instantPayments(s).map(p => p.units)).toEqual([2, 2, 4]);
    expect(handNet(s, STAKE)).toEqual([-8, 24, -8, -8]);
  });

  it('pays the seat flower pair only for your own seat (South is seat 1 with dealer 0)', () => {
    const south = state([[], [flower('orchid'), season('summer')], [], []]);
    expect(instantPayments(south)).toEqual([{ seat: 1, reason: 'Both your seat flowers', units: 2 }]);
    const wrongSeat = state([[flower('orchid'), season('summer')], [], [], []]);
    expect(instantPayments(wrongSeat)).toEqual([]);
  });

  it('pays kongs: exposed 2, concealed 4', () => {
    const s = state([[], [], [], []], [[kong(suit('dot', 5), true)], [kong(suit('bamboo', 2), false)], [], []]);
    expect(instantPayments(s).map(p => [p.seat, p.units])).toEqual([[0, 2], [1, 4]]);
  });

  it('respects the house-rule switches', () => {
    const off = mergeRules({ instantFlowerPayments: false, instantKongPayments: false });
    const s = state([[animal('cat'), animal('rat')], [], [], []], [[kong(suit('dot', 5), true)], [], [], []], off);
    expect(instantPayments(s)).toEqual([]);
  });
});
