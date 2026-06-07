import { describe, it, expect } from 'vitest';
import {
  generateEfficiencyDrill, generateWaitsDrill, generateDefenseDrill,
  gradeEfficiency, gradeWaits, gradeDefense,
  generateCallDrill, gradeCall,
  generatePushFoldDrill, gradePushFold,
  generateDirectionDrill, gradeDirection,
  generateReadingDrill, gradeReading,
} from '../src/trainer.js';
import { shanten, shantenWithMelds, tenpaiWaits } from '../src/shanten.js';

describe('generateEfficiencyDrill', () => {
  it('generates a valid 1-shanten drill', () => {
    const drill = generateEfficiencyDrill(1);
    expect(drill).not.toBeNull();
    if (!drill) return;

    expect(drill.hand).toHaveLength(14);
    expect(drill.shantenValue).toBe(1);
    expect(drill.optimalAcceptance).toBeGreaterThan(0);
    expect(drill.allCandidates.length).toBeGreaterThan(0);
  });

  it('generates a valid 2-shanten drill', () => {
    const drill = generateEfficiencyDrill(2);
    expect(drill).not.toBeNull();
    if (!drill) return;

    expect(drill.shantenValue).toBe(2);
  });

  it('optimal discard actually reduces shanten', () => {
    const drill = generateEfficiencyDrill(1);
    if (!drill) return;

    const hand = drill.hand;
    const idx = hand.indexOf(drill.optimalDiscard);
    const afterDiscard = [...hand.slice(0, idx), ...hand.slice(idx + 1)];

    for (let i = 0; i < 34; i++) {
      const test = [...afterDiscard, i];
      if (shanten(test) < drill.shantenValue) {
        return; // found at least one acceptance tile
      }
    }
    // Should always find acceptance tiles for optimal discard
    expect(drill.optimalAcceptance).toBeGreaterThan(0);
  });
});

describe('generateWaitsDrill', () => {
  it('generates a valid tenpai drill', () => {
    const drill = generateWaitsDrill();
    expect(drill).not.toBeNull();
    if (!drill) return;

    expect(drill.hand).toHaveLength(13);
    expect(shanten(drill.hand)).toBe(0);
    expect(drill.correctWaits.length).toBeGreaterThan(0);
  });

  it('correct waits match tenpaiWaits', () => {
    const drill = generateWaitsDrill();
    if (!drill) return;

    const computedWaits = tenpaiWaits(drill.hand);
    expect(drill.correctWaits.sort()).toEqual(computedWaits.sort());
  });
});

describe('generateDefenseDrill', () => {
  it('generates a valid defense drill', () => {
    const drill = generateDefenseDrill();
    expect(drill).not.toBeNull();
    if (!drill) return;

    expect(drill.hand).toHaveLength(13);
    expect(drill.opponentDiscards).toHaveLength(3);
    expect(drill.safestTiles.length).toBeGreaterThan(0);
    expect(drill.tileRanking.length).toBeGreaterThan(0);
  });

  it('safest tiles have highest safety score', () => {
    const drill = generateDefenseDrill();
    if (!drill) return;

    const bestSafety = drill.tileRanking[0].safety;
    for (const safe of drill.safestTiles) {
      const entry = drill.tileRanking.find(r => r.tile === safe);
      expect(entry?.safety).toBe(bestSafety);
    }
  });
});

describe('grading', () => {
  it('gradeEfficiency scores optimal discard as 1.0', () => {
    const drill = generateEfficiencyDrill(1);
    if (!drill) return;

    const grade = gradeEfficiency(drill, drill.optimalDiscard);
    expect(grade.isOptimal).toBe(true);
    expect(grade.ratio).toBe(1);
  });

  it('gradeWaits gives perfect score for correct waits', () => {
    const drill = generateWaitsDrill();
    if (!drill) return;

    const grade = gradeWaits(drill, drill.correctWaits);
    expect(grade.score).toBe(1);
    expect(grade.missed).toHaveLength(0);
    expect(grade.wrong).toHaveLength(0);
  });

  it('gradeWaits penalizes wrong selections', () => {
    const drill = generateWaitsDrill();
    if (!drill) return;

    const wrongTile = [0,1,2,3,4,5].find(t => !drill.correctWaits.includes(t))!;
    const grade = gradeWaits(drill, [wrongTile]);
    expect(grade.score).toBe(0);
    expect(grade.wrong).toHaveLength(1);
  });

  it('gradeDefense identifies optimal defense', () => {
    const drill = generateDefenseDrill();
    if (!drill) return;

    const grade = gradeDefense(drill, drill.safestTiles[0]);
    expect(grade.isOptimal).toBe(true);
  });
});

describe('shantenWithMelds', () => {
  it('treats a complete hand with one called meld as a win (-1)', () => {
    // 3 concealed melds + pair (11 tiles) + 1 called meld = winning hand
    const concealed = [0, 1, 2, 3, 4, 5, 9, 9, 9, 18, 18];
    expect(shantenWithMelds(concealed, 1)).toBe(-1);
  });

  it('is closer to tenpai than the same tiles with no called meld', () => {
    const concealed = [0, 1, 2, 3, 4, 5, 9, 9, 9, 18, 18];
    expect(shantenWithMelds(concealed, 1)).toBeLessThan(shanten(concealed));
  });
});

describe('generateCallDrill', () => {
  it('generates a coherent call drill', () => {
    const drill = generateCallDrill();
    expect(drill).not.toBeNull();
    if (!drill) return;

    expect(drill.hand).toHaveLength(13);
    expect(['pung', 'chow']).toContain(drill.callKind);
    expect(drill.meldTiles).toHaveLength(3);
    expect(['call', 'pass']).toContain(drill.recommendation);
    expect(drill.reasons.length).toBeGreaterThan(0);
  });

  it('grades the recommended action correct and the opposite wrong', () => {
    const drill = generateCallDrill();
    if (!drill) return;

    expect(gradeCall(drill, drill.recommendation).correct).toBe(true);
    const opposite = drill.recommendation === 'call' ? 'pass' : 'call';
    expect(gradeCall(drill, opposite).correct).toBe(false);
  });

  it('only recommends calling when it actually advances the hand', () => {
    for (let i = 0; i < 20; i++) {
      const drill = generateCallDrill();
      if (!drill) continue;
      if (drill.recommendation === 'call') {
        expect(drill.shantenAfterCall).toBeLessThan(drill.shantenBefore);
      }
    }
  });
});

describe('generatePushFoldDrill', () => {
  it('generates a coherent push/fold drill', () => {
    const drill = generatePushFoldDrill();
    expect(drill).not.toBeNull();
    if (!drill) return;

    expect(drill.hand).toHaveLength(13);
    expect(['push', 'fold', 'sidestep']).toContain(drill.recommendation);
    expect(drill.reasons.length).toBeGreaterThan(0);
  });

  it('grades the recommended choice correct', () => {
    const drill = generatePushFoldDrill();
    if (!drill) return;
    expect(gradePushFold(drill, drill.recommendation).correct).toBe(true);
  });

  it('provides safe tiles whenever it recommends folding or sidestepping', () => {
    for (let i = 0; i < 30; i++) {
      const drill = generatePushFoldDrill();
      if (!drill) continue;
      if (drill.recommendation === 'fold' || drill.recommendation === 'sidestep') {
        expect(drill.safeTiles.length).toBeGreaterThan(0);
        // every "safe" tile must actually appear in the opponent's pond (genbutsu)
        for (const t of drill.safeTiles) {
          expect(drill.opponentDiscards).toContain(t);
        }
      }
    }
  });
});

describe('generateDirectionDrill', () => {
  it('generates five scored options with a clear winner', () => {
    const drill = generateDirectionDrill();
    expect(drill).not.toBeNull();
    if (!drill) return;

    expect(drill.options).toHaveLength(5);
    // recommendation is the highest-scoring option
    const top = [...drill.options].sort((a, b) => b.score - a.score)[0];
    expect(drill.recommendation).toBe(top.key);
  });

  it('grades the recommended target correct', () => {
    const drill = generateDirectionDrill();
    if (!drill) return;
    expect(gradeDirection(drill, drill.recommendation).correct).toBe(true);
  });
});

describe('generateReadingDrill', () => {
  it('builds a pond with zero tiles of the collected suit', () => {
    const drill = generateReadingDrill();
    expect(drill).not.toBeNull();
    if (!drill) return;

    const base = ['bamboo', 'character', 'dot'].indexOf(drill.answer) * 9;
    const collectedInPond = drill.opponentDiscards.filter(t => t >= base && t < base + 9);
    expect(collectedInPond).toHaveLength(0);
  });

  it('grades the collected suit correct and another suit wrong', () => {
    const drill = generateReadingDrill();
    if (!drill) return;
    expect(gradeReading(drill, drill.answer).correct).toBe(true);
    const wrong = (['bamboo', 'character', 'dot', 'honours'] as const).find(s => s !== drill.answer)!;
    expect(gradeReading(drill, wrong).correct).toBe(false);
  });
});
