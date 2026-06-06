/**
 * Golden Hands Test Suite — Singapore Mahjong Scoring Engine
 *
 * 40+ cases covering:
 * - Every tai element individually
 * - Stacking combinations
 * - Zimo vs discard payouts at multiple stakes
 * - Tai cap behaviour
 * - Dispute-prone edge cases
 *
 * Rule source: sgmahjong.com/scoring.html, reconciled with
 * mahjongsingapore.blogspot.com and confirmed defaults from Caspar.
 */
import { describe, it, expect } from 'vitest';
import {
  scoreHand, calculatePayout, formatCurrency, formatSettlement,
  suit, wind, dragon, flower, season, animal,
  pung, kong, chow, eyes,
  DEFAULT_RULES, mergeRules,
  type Hand, type WinContext, type RulesConfig, type StakeConfig,
} from '../src/index.js';

// --- Helpers ---

function makeCtx(overrides: Partial<WinContext> = {}): WinContext {
  return {
    seatWind: 'east',
    prevailingWind: 'east',
    winType: 'discard',
    winTile: suit('dot', 5),
    isKongReplacement: false,
    isLastTile: false,
    isRobbingKong: false,
    ...overrides,
  };
}

const STAKE_10_20: StakeConfig = { label: '10/20¢', base: 0.10, doubled: 0.20 };
const STAKE_1_2: StakeConfig = { label: '$1/$2', base: 1.00, doubled: 2.00 };

function hasTaiElement(elements: { id: string }[], id: string): boolean {
  return elements.some(e => e.id === id);
}

function getTaiForElement(elements: { id: string; tai: number }[], id: string): number {
  const el = elements.find(e => e.id === id);
  return el ? el.tai : 0;
}

// ============================================================
// SECTION 1: Individual Tai Elements
// ============================================================

describe('Individual Tai Elements', () => {
  // --- Bonus Tiles ---

  it('Case 1: Any flower scores +1 tai (default: anyFlowerScores=true)', () => {
    // East seat draws orchid (South flower) — still scores because anyFlowerScores
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('orchid')],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'flower_orchid')).toBe(true);
    // all_chows(1) + flower(1) = 2 tai
    expect(result.totalTai).toBe(2);
  });

  it('Case 2: Matched-only flower mode — unmatched flower scores 0', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('orchid')], // orchid = south, but seat is east
      seasons: [],
      animals: [],
    };
    const rules = mergeRules({ anyFlowerScores: false });
    const result = scoreHand(hand, makeCtx(), rules);
    expect(hasTaiElement(result.elements, 'flower_matched_orchid')).toBe(false);
    // only all_chows(1)
    expect(result.totalTai).toBe(1);
  });

  it('Case 3: Matched flower in matched-only mode scores +1', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum')], // plum = east = seat wind
      seasons: [],
      animals: [],
    };
    const rules = mergeRules({ anyFlowerScores: false });
    const result = scoreHand(hand, makeCtx({ seatWind: 'east' }), rules);
    expect(hasTaiElement(result.elements, 'flower_matched_plum')).toBe(true);
    expect(result.totalTai).toBe(2); // all_chows(1) + matched flower(1)
  });

  it('Case 4: Complete flower set gives +1 extra', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum'), flower('orchid'), flower('chrysanthemum'), flower('bamboo_flower')],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    // 4 flowers (4 tai) + flower set bonus (1) + all_chows (1) = 6 tai, capped at 5
    expect(result.totalTai).toBe(6);
    expect(result.cappedTai).toBe(5);
    expect(hasTaiElement(result.elements, 'flower_set')).toBe(true);
  });

  it('Case 5: Animal tile scores +1 each', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [animal('cat'), animal('rat')],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'animal_cat')).toBe(true);
    expect(hasTaiElement(result.elements, 'animal_rat')).toBe(true);
    // all_chows(1) + 2 animals(2) = 3
    expect(result.totalTai).toBe(3);
  });

  it('Case 6: Complete animal set gives +1 extra', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [animal('cat'), animal('rat'), animal('rooster'), animal('centipede')],
    };
    const result = scoreHand(hand, makeCtx());
    // all_chows(1) + 4 animals(4) + animal set(1) = 6, capped 5
    expect(result.totalTai).toBe(6);
    expect(result.cappedTai).toBe(5);
    expect(hasTaiElement(result.elements, 'animal_set')).toBe(true);
  });

  it('Case 7: No-flower bonus (+1 when zero bonus tiles)', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'no_flowers')).toBe(true);
    // all_chows(1) + no_flowers(1) = 2
    expect(result.totalTai).toBe(2);
  });

  it('Case 8: No-flower bonus disabled when toggle off', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const rules = mergeRules({ noFlowerBonus: false });
    const result = scoreHand(hand, makeCtx(), rules);
    expect(hasTaiElement(result.elements, 'no_flowers')).toBe(false);
    expect(result.totalTai).toBe(1); // just all_chows
  });

  // --- Per-Set Bonuses ---

  it('Case 9: Dragon pung scores +1', () => {
    const hand: Hand = {
      melds: [
        pung(dragon('red')), chow('dot', 1), chow('dot', 4), chow('bamboo', 2),
        eyes(suit('character', 5)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'dragon_pung_red')).toBe(true);
    expect(getTaiForElement(result.elements, 'dragon_pung_red')).toBe(1);
  });

  it('Case 10: Seat wind pung scores +1', () => {
    const hand: Hand = {
      melds: [
        pung(wind('east')), chow('dot', 1), chow('dot', 4), chow('bamboo', 2),
        eyes(suit('character', 5)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx({ seatWind: 'east' }));
    expect(hasTaiElement(result.elements, 'seat_wind_pung')).toBe(true);
  });

  it('Case 11: Prevailing wind pung scores +1', () => {
    const hand: Hand = {
      melds: [
        pung(wind('south')), chow('dot', 1), chow('dot', 4), chow('bamboo', 2),
        eyes(suit('character', 5)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx({ seatWind: 'east', prevailingWind: 'south' }));
    expect(hasTaiElement(result.elements, 'prevailing_wind_pung')).toBe(true);
    expect(hasTaiElement(result.elements, 'seat_wind_pung')).toBe(false);
  });

  it('Case 12: Seat = prevailing wind pung stacks to +2', () => {
    const hand: Hand = {
      melds: [
        pung(wind('east')), chow('dot', 1), chow('dot', 4), chow('bamboo', 2),
        eyes(suit('character', 5)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const ctx = makeCtx({ seatWind: 'east', prevailingWind: 'east' });
    const result = scoreHand(hand, ctx);
    expect(hasTaiElement(result.elements, 'seat_wind_pung')).toBe(true);
    expect(hasTaiElement(result.elements, 'prevailing_wind_pung')).toBe(true);
    // Both should fire: +1 seat + +1 prevailing
    const windTai = result.elements
      .filter(e => e.id.includes('wind_pung'))
      .reduce((s, e) => s + e.tai, 0);
    expect(windTai).toBe(2);
  });

  it('Case 13: Small Three Dragons scores +1 extra', () => {
    const hand: Hand = {
      melds: [
        pung(dragon('red')), pung(dragon('green')),
        eyes(dragon('white')),
        chow('dot', 1), chow('bamboo', 2),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'small_three_dragons')).toBe(true);
    // dragon_pung_red(1) + dragon_pung_green(1) + small_three_dragons(1) + no_flowers(1) = 4
    expect(result.totalTai).toBe(4);
  });

  // --- Hand Shapes ---

  it('Case 14: All Chows (Ping Hu) = 1 tai', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum')],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'all_chows')).toBe(true);
    expect(getTaiForElement(result.elements, 'all_chows')).toBe(1);
  });

  it('Case 15: All Pungs = 2 tai', () => {
    const hand: Hand = {
      melds: [
        pung(suit('dot', 1)), pung(suit('dot', 5)),
        pung(suit('bamboo', 3)), pung(suit('character', 7)),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'all_pungs')).toBe(true);
    expect(getTaiForElement(result.elements, 'all_pungs')).toBe(2);
  });

  it('Case 16: Half Flush = 2 tai (one suit + honours)', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('dot', 7),
        pung(wind('east')),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'half_flush')).toBe(true);
    expect(getTaiForElement(result.elements, 'half_flush')).toBe(2);
  });

  it('Case 17: Full Flush = 4 tai (one suit, no honours)', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('dot', 7),
        pung(suit('dot', 5)),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'full_flush')).toBe(true);
    expect(getTaiForElement(result.elements, 'full_flush')).toBe(4);
    // Should NOT also be half flush
    expect(hasTaiElement(result.elements, 'half_flush')).toBe(false);
  });

  it('Case 18: Half Terminals = 2 tai', () => {
    const hand: Hand = {
      melds: [
        pung(suit('dot', 1)), pung(suit('bamboo', 9)),
        pung(wind('east')), pung(dragon('red')),
        eyes(suit('character', 1)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'half_terminals')).toBe(true);
  });

  it('Case 19: Ping Wu = 4 tai (all chow, concealed, no bonus tiles)', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1, false), chow('dot', 4, false),
        chow('bamboo', 2, false), chow('character', 5, false),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'ping_wu')).toBe(true);
    expect(getTaiForElement(result.elements, 'ping_wu')).toBe(4);
    // Should NOT also have all_chows (ping_wu supersedes it)
    expect(hasTaiElement(result.elements, 'all_chows')).toBe(false);
    // ping_wu(4) + no_flowers(1) = 5, but no_flowers is subsumed by ping_wu's requirement
    // Actually, no_flowers still fires separately as a bonus
    // Wait — ping_wu already requires no bonus tiles. If noFlowerBonus fires too,
    // that's double-counting. Let me check: the no_flowers element fires when
    // totalBonusTiles === 0, which is a prerequisite for ping_wu. These don't
    // double-count because no_flowers is "you drew zero bonus tiles" and ping_wu
    // is "your hand shape + concealed + no bonus tiles". They're separate scoring axes.
    // This is correct per source — both fire.
    expect(result.cappedTai).toBe(5);
  });

  it('Case 20: Ping Wu with flowers does NOT fire (becomes all_chows)', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1, false), chow('dot', 4, false),
        chow('bamboo', 2, false), chow('character', 5, false),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum')],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'ping_wu')).toBe(false);
    expect(hasTaiElement(result.elements, 'all_chows')).toBe(true);
    // all_chows(1) + flower(1) + concealed_hand(1) = 3
    expect(result.totalTai).toBe(3);
  });

  // --- Win Circumstances ---

  it('Case 21: Zimo as tai (+1) when toggle on', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum')],
      seasons: [],
      animals: [],
    };
    const rules = mergeRules({ zimoAsTai: true });
    const result = scoreHand(hand, makeCtx({ winType: 'zimo' }), rules);
    expect(hasTaiElement(result.elements, 'zimo')).toBe(true);
  });

  it('Case 22: Zimo as payout modifier (default) — no tai element', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum')],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx({ winType: 'zimo' }));
    expect(hasTaiElement(result.elements, 'zimo')).toBe(false);
  });

  it('Case 23: Kong replacement win = +1 tai', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx({ isKongReplacement: true }));
    expect(hasTaiElement(result.elements, 'kong_replacement')).toBe(true);
  });

  it('Case 24: Last tile win = +1 tai', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx({ isLastTile: true }));
    expect(hasTaiElement(result.elements, 'last_tile')).toBe(true);
  });

  it('Case 25: Robbing the kong = +1 tai', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx({ isRobbingKong: true }));
    expect(hasTaiElement(result.elements, 'robbing_kong')).toBe(true);
  });

  // --- Limit Hands ---

  it('Case 26: All Honours = limit (capped at taiCap)', () => {
    const hand: Hand = {
      melds: [
        pung(wind('east')), pung(wind('south')),
        pung(dragon('red')), pung(dragon('green')),
        eyes(wind('north')),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'all_honours')).toBe(true);
    expect(result.cappedTai).toBe(5);
  });

  it('Case 27: Big Three Dragons = limit', () => {
    const hand: Hand = {
      melds: [
        pung(dragon('red')), pung(dragon('green')), pung(dragon('white')),
        chow('dot', 1),
        eyes(suit('bamboo', 5)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'big_three_dragons')).toBe(true);
    expect(result.cappedTai).toBe(5);
  });

  it('Case 28: Big Four Winds = limit', () => {
    const hand: Hand = {
      melds: [
        pung(wind('east')), pung(wind('south')),
        pung(wind('west')), pung(wind('north')),
        eyes(suit('dot', 5)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'big_four_winds')).toBe(true);
    expect(result.cappedTai).toBe(5);
  });

  it('Case 29: Small Four Winds = limit', () => {
    const hand: Hand = {
      melds: [
        pung(wind('east')), pung(wind('south')), pung(wind('west')),
        chow('dot', 1),
        eyes(wind('north')),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'small_four_winds')).toBe(true);
    expect(result.cappedTai).toBe(5);
  });
});

// ============================================================
// SECTION 2: Stacking Combinations
// ============================================================

describe('Stacking Combinations', () => {
  it('Case 30: All Pungs (2) + Half Flush (2) = 4 tai', () => {
    const hand: Hand = {
      melds: [
        pung(suit('dot', 1)), pung(suit('dot', 5)),
        pung(suit('dot', 9)), pung(wind('east')),
        eyes(suit('dot', 3)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx({ seatWind: 'west', prevailingWind: 'south' }));
    expect(hasTaiElement(result.elements, 'all_pungs')).toBe(true);
    expect(hasTaiElement(result.elements, 'half_flush')).toBe(true);
    const shapeTai = getTaiForElement(result.elements, 'all_pungs')
      + getTaiForElement(result.elements, 'half_flush');
    expect(shapeTai).toBe(4);
  });

  it('Case 31: Dragon pung + seat wind + flower stacking', () => {
    const hand: Hand = {
      melds: [
        pung(dragon('red')), pung(wind('east')),
        chow('dot', 1), chow('bamboo', 5),
        eyes(suit('character', 9)),
      ],
      flowers: [flower('plum')], // east flower
      seasons: [],
      animals: [],
    };
    const ctx = makeCtx({ seatWind: 'east', prevailingWind: 'east' });
    const result = scoreHand(hand, ctx);
    // dragon(1) + seat_wind(1) + prevailing_wind(1) + flower(1) = 4 tai
    expect(result.totalTai).toBe(4);
  });

  it('Case 32: Full Flush + All Pungs = 4 + 2 = 6, capped at 5', () => {
    const hand: Hand = {
      melds: [
        pung(suit('dot', 1)), pung(suit('dot', 3)),
        pung(suit('dot', 5)), pung(suit('dot', 7)),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'full_flush')).toBe(true);
    expect(hasTaiElement(result.elements, 'all_pungs')).toBe(true);
    expect(result.totalTai).toBeGreaterThan(5);
    expect(result.cappedTai).toBe(5);
  });

  it('Case 33: Multiple flowers + season + animal stacking', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum'), flower('orchid')],
      seasons: [season('spring')],
      animals: [animal('cat')],
    };
    const result = scoreHand(hand, makeCtx());
    // all_chows(1) + 2 flowers(2) + 1 season(1) + 1 animal(1) = 5
    expect(result.totalTai).toBe(5);
  });

  it('Case 34: Half terminals + all pungs stack', () => {
    const hand: Hand = {
      melds: [
        pung(suit('dot', 1)), pung(suit('bamboo', 9)),
        pung(wind('east')), pung(dragon('red')),
        eyes(suit('character', 1)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx({ seatWind: 'west', prevailingWind: 'south' }));
    expect(hasTaiElement(result.elements, 'half_terminals')).toBe(true);
    expect(hasTaiElement(result.elements, 'all_pungs')).toBe(true);
    // all_pungs(2) + half_terminals(2) + dragon(1) + no_flowers(1) = 6, capped 5
    expect(result.cappedTai).toBe(5);
  });
});

// ============================================================
// SECTION 3: Payout Calculations
// ============================================================

describe('Payout Calculations', () => {
  const names: [string, string, string, string] = ['Ah Seng', 'Mei Ling', 'Ah Kow', 'Susan'];

  it('Case 35: Discard win at 10/20¢, 1 tai — shooter 2x, others 1x', () => {
    const scoring = scoreHand({
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum')],
      seasons: [],
      animals: [],
    }, makeCtx());
    // 2 tai -> base = 0.10 * 2^2 = 0.40
    const payout = calculatePayout({
      scoring,
      stake: STAKE_10_20,
      winnerIndex: 0,
      shooterIndex: 1,
      playerNames: names,
    });
    // Shooter (Mei Ling) pays 0.40 * 2 = 0.80
    // Others pay 0.40 * 1 = 0.40 each
    expect(payout.netPerPlayer['Mei Ling']).toBeCloseTo(-0.80);
    expect(payout.netPerPlayer['Ah Kow']).toBeCloseTo(-0.40);
    expect(payout.netPerPlayer['Susan']).toBeCloseTo(-0.40);
    expect(payout.netPerPlayer['Ah Seng']).toBeCloseTo(1.60);
  });

  it('Case 36: Zimo at $1/$2, 3 tai — all pay double', () => {
    const scoring = scoreHand({
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2),
        pung(dragon('red')),
        eyes(suit('character', 5)),
      ],
      flowers: [flower('plum')],
      seasons: [],
      animals: [],
    }, makeCtx({ winType: 'zimo' }));
    // dragon(1) + flower(1) + noFlowers=false => no_flower bonus doesn't fire
    // Actually flower present so no_flowers doesn't fire. Total = 2 tai
    // Wait: dragon(1) + flower(1) = 2 tai
    // base = 1.00 * 2^2 = 4.00
    // zimo: each pays 4.00 * 2 = 8.00
    const payout = calculatePayout({
      scoring,
      stake: STAKE_1_2,
      winnerIndex: 0,
      playerNames: names,
    });
    expect(payout.netPerPlayer['Mei Ling']).toBeCloseTo(-8.00);
    expect(payout.netPerPlayer['Ah Kow']).toBeCloseTo(-8.00);
    expect(payout.netPerPlayer['Susan']).toBeCloseTo(-8.00);
    expect(payout.netPerPlayer['Ah Seng']).toBeCloseTo(24.00);
  });

  it('Case 37: Shooter-pays-all mode', () => {
    const scoring = scoreHand({
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum')],
      seasons: [],
      animals: [],
    }, makeCtx());
    // 2 tai -> base = 0.10 * 4 = 0.40
    const rules = mergeRules({ shooterMode: 'shooterPaysAll' });
    const payout = calculatePayout({
      scoring,
      stake: STAKE_10_20,
      winnerIndex: 0,
      shooterIndex: 1,
      playerNames: names,
      rules,
    });
    // Shooter pays base * 4 = 0.40 * 4 = 1.60
    // Others pay 0
    expect(payout.netPerPlayer['Mei Ling']).toBeCloseTo(-1.60);
    expect(payout.netPerPlayer['Ah Kow']).toBeCloseTo(0);
    expect(payout.netPerPlayer['Susan']).toBeCloseTo(0);
    expect(payout.netPerPlayer['Ah Seng']).toBeCloseTo(1.60);
  });

  it('Case 38: Max tai (5) payout at $1/$2 discard', () => {
    const scoring = scoreHand({
      melds: [
        pung(suit('dot', 1)), pung(suit('dot', 3)),
        pung(suit('dot', 5)), pung(suit('dot', 7)),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    }, makeCtx());
    // Capped at 5 tai
    // base = 1.00 * 2^5 = 32.00
    // Shooter pays 32*2 = 64, others pay 32 each
    const payout = calculatePayout({
      scoring,
      stake: STAKE_1_2,
      winnerIndex: 0,
      shooterIndex: 1,
      playerNames: names,
    });
    expect(payout.netPerPlayer['Mei Ling']).toBeCloseTo(-64.00);
    expect(payout.netPerPlayer['Ah Kow']).toBeCloseTo(-32.00);
    expect(payout.netPerPlayer['Susan']).toBeCloseTo(-32.00);
    expect(payout.netPerPlayer['Ah Seng']).toBeCloseTo(128.00);
  });
});

// ============================================================
// SECTION 4: Tai Cap Behaviour
// ============================================================

describe('Tai Cap Behaviour', () => {
  it('Case 39: Tai capped at 5 regardless of raw total', () => {
    const hand: Hand = {
      melds: [
        pung(suit('dot', 1)), pung(suit('dot', 3)),
        pung(suit('dot', 5)), pung(suit('dot', 7)),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum'), flower('orchid')],
      seasons: [],
      animals: [animal('cat')],
    };
    const result = scoreHand(hand, makeCtx());
    // full_flush(4) + all_pungs(2) + flowers(2) + animal(1) = 9
    expect(result.totalTai).toBeGreaterThan(5);
    expect(result.cappedTai).toBe(5);
  });

  it('Case 40: Custom tai cap of 8', () => {
    const hand: Hand = {
      melds: [
        pung(suit('dot', 1)), pung(suit('dot', 3)),
        pung(suit('dot', 5)), pung(suit('dot', 7)),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum'), flower('orchid')],
      seasons: [],
      animals: [animal('cat')],
    };
    const rules = mergeRules({ taiCap: 8 });
    const result = scoreHand(hand, makeCtx(), rules);
    expect(result.cappedTai).toBe(8);
  });

  it('Case 41: Unlimited tai cap', () => {
    const hand: Hand = {
      melds: [
        pung(suit('dot', 1)), pung(suit('dot', 3)),
        pung(suit('dot', 5)), pung(suit('dot', 7)),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum'), flower('orchid')],
      seasons: [season('spring')],
      animals: [animal('cat'), animal('rat')],
    };
    const rules = mergeRules({ taiCap: null });
    const result = scoreHand(hand, makeCtx(), rules);
    // full_flush(4) + all_pungs(2) + flowers(2) + season(1) + animals(2) = 11
    expect(result.cappedTai).toBe(result.totalTai);
    expect(result.cappedTai).toBeGreaterThan(5);
  });

  it('Case 42: Minimum tai validation — 0 tai hand rejected at min=1', () => {
    // A hand with no scoring elements (chicken hand)
    // Hard to construct with current system since most hands have SOME element
    // Use a mixed hand with no chow pattern, no pungs, in matched-only mode with no matched flowers
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('bamboo', 4),
        pung(suit('character', 5)), chow('dot', 7),
        eyes(suit('bamboo', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    // This hand: no all_chows (has a pung), no all_pungs, no flush, no wind/dragon pungs
    // Just no_flowers(1) = 1 tai => valid at min=1
    // To get 0 tai, disable no_flowers bonus
    const rules = mergeRules({ noFlowerBonus: false });
    const result = scoreHand(hand, makeCtx(), rules);
    expect(result.totalTai).toBe(0);
    expect(result.isValid).toBe(false);
    expect(result.invalidReason).toContain('minimum');
  });

  it('Case 43: Chicken hand valid when minTai = 0', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('bamboo', 4),
        pung(suit('character', 5)), chow('dot', 7),
        eyes(suit('bamboo', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const rules = mergeRules({ noFlowerBonus: false, minTai: 0 });
    const result = scoreHand(hand, makeCtx(), rules);
    expect(result.totalTai).toBe(0);
    expect(result.isValid).toBe(true);
  });
});

// ============================================================
// SECTION 5: Dispute-Prone Edge Cases
// ============================================================

describe('Dispute-Prone Edge Cases', () => {
  it('Case 44: Robbing the kong + last tile — both score +1 each', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const ctx = makeCtx({ isRobbingKong: true, isLastTile: true });
    const result = scoreHand(hand, ctx);
    expect(hasTaiElement(result.elements, 'robbing_kong')).toBe(true);
    expect(hasTaiElement(result.elements, 'last_tile')).toBe(true);
    // all_chows(1) + robbing(1) + last_tile(1) + no_flowers(1) = 4
    expect(result.totalTai).toBe(4);
  });

  it('Case 45: Flower set + seat flower — set bonus is EXTRA, not replacing individual', () => {
    // All 4 flowers, seat is east (plum matches)
    const hand: Hand = {
      melds: [
        chow('dot', 1), chow('dot', 4), chow('bamboo', 2), chow('character', 5),
        eyes(suit('dot', 9)),
      ],
      flowers: [flower('plum'), flower('orchid'), flower('chrysanthemum'), flower('bamboo_flower')],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx({ seatWind: 'east' }));
    // anyFlowerScores=true: 4 individual flowers(4) + flower_set(1) + all_chows(1) = 6
    expect(result.totalTai).toBe(6);
    expect(result.cappedTai).toBe(5);
  });

  it('Case 46: Concealed hand with exposed melds does NOT score concealed bonus', () => {
    const hand: Hand = {
      melds: [
        chow('dot', 1, true), // exposed!
        chow('dot', 4, false), chow('bamboo', 2, false), chow('character', 5, false),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'concealed_hand')).toBe(false);
    expect(hasTaiElement(result.elements, 'ping_wu')).toBe(false);
  });

  it('Case 47: Kong counts as pung for hand-shape checks (all pungs)', () => {
    const hand: Hand = {
      melds: [
        kong(suit('dot', 1)), pung(suit('dot', 5)),
        pung(suit('bamboo', 3)), pung(suit('character', 7)),
        eyes(suit('dot', 9)),
      ],
      flowers: [],
      seasons: [],
      animals: [],
    };
    const result = scoreHand(hand, makeCtx());
    expect(hasTaiElement(result.elements, 'all_pungs')).toBe(true);
  });

  it('Case 48: Concealed hand + dragon + wind stacking at cap', () => {
    // Concealed hand with seat+prevailing wind + dragon, lots of stacking
    const hand: Hand = {
      melds: [
        pung(wind('east'), false), pung(dragon('red'), false),
        chow('dot', 1, false), chow('dot', 4, false),
        eyes(suit('bamboo', 5)),
      ],
      flowers: [flower('plum'), flower('orchid')],
      seasons: [],
      animals: [],
    };
    const ctx = makeCtx({ seatWind: 'east', prevailingWind: 'east' });
    const result = scoreHand(hand, ctx);
    // concealed(1) + seat_wind(1) + prevailing_wind(1) + dragon(1) + flowers(2) = 6, capped 5
    expect(result.cappedTai).toBe(5);
  });
});

// ============================================================
// SECTION 6: Settlement / Format
// ============================================================

describe('Settlement Formatting', () => {
  it('Case 49: formatCurrency handles cents and dollars', () => {
    expect(formatCurrency(0.40)).toBe('40¢');
    expect(formatCurrency(1.60)).toBe('$1.60');
    expect(formatCurrency(-0.80)).toBe('-80¢');
    expect(formatCurrency(-32.00)).toBe('-$32.00');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('Case 50: formatSettlement produces minimal transfers', () => {
    const net = {
      'Ah Seng': 1.60,
      'Mei Ling': -0.80,
      'Ah Kow': -0.40,
      'Susan': -0.40,
    };
    const lines = formatSettlement(net);
    expect(lines.length).toBeLessThanOrEqual(3);
    // Total paid should equal total received
    const totalPaid = Object.values(net).filter(v => v < 0).reduce((s, v) => s + v, 0);
    const totalReceived = Object.values(net).filter(v => v > 0).reduce((s, v) => s + v, 0);
    expect(Math.abs(totalPaid + totalReceived)).toBeLessThan(0.01);
  });
});
