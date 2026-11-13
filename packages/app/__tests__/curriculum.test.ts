import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CURRICULUM } from '../src/learn/curriculum';
import { CLIPS, introFor } from '../src/learn/VideoIntro';

describe('curriculum', () => {
  it('every question has a valid answer', () => {
    for (const unit of CURRICULUM) {
      for (const lesson of unit.lessons) {
        for (const t of lesson.tasks) {
          if (t.kind === 'choose') expect(t.answer).toBeLessThan(t.options.length);
          if (t.kind === 'pick') for (const i of t.correct) expect(i).toBeLessThan(t.tiles.length);
        }
      }
    }
  });
  it('lesson ids are unique within a unit and units have covers', () => {
    for (const unit of CURRICULUM) {
      expect(new Set(unit.lessons.map(l => l.id)).size).toBe(unit.lessons.length);
      expect(unit.cover).toMatch(/\.webp$/);
    }
  });
  it('every listed clip has its video and poster in public/video', () => {
    for (const id of CLIPS) {
      expect(existsSync(resolve(__dirname, `../public/video/${id}.mp4`)), id).toBe(true);
      expect(existsSync(resolve(__dirname, `../public/video/${id}.webp`)), id).toBe(true);
    }
  });
  it('a unit clip opens its first lesson, and lessons can have their own', () => {
    const tiles = CURRICULUM.find(u => u.id === 'tiles')!;
    expect(introFor(tiles, tiles.lessons[0])).toBe('X-suits');
    // Without its own explainer, the first lesson opens with the unit clip and later lessons get none.
    const bare = { ...tiles, lessons: tiles.lessons.map(l => ({ ...l, video: undefined })) };
    expect(introFor(bare, bare.lessons[0])).toBe('U1');
    expect(introFor(bare, bare.lessons[1])).toBeUndefined();
    const sets = CURRICULUM.find(u => u.id === 'sets')!;
    expect(introFor(sets, sets.lessons[0])).toBe('X-pung'); // the lesson's explainer beats the unit intro
  });
});

describe('worked hands in the Scoring unit match the engine', () => {
  // Imported here so the main suite above stays independent of the game package.
  it('scores each worked hand exactly as the lesson says', async () => {
    const { WORKED } = await import('../src/learn/curriculum');
    const { scoreWinningHand } = await import('@mahjongkaki/game');
    const { tileToIndex, suit, flower, season, DEFAULT_RULES } = await import('@mahjongkaki/engine');
    const score = (tiles: number[], bonus: Parameters<typeof scoreWinningHand>[2], seat: 'east' | 'south', win: number) =>
      scoreWinningHand(tiles, [], bonus, seat, 'east', 'discard', win, DEFAULT_RULES)!;

    const one = score(WORKED.oneTai, [flower('plum')], 'south', WORKED.oneTai[13]);
    expect(one.cappedTai).toBe(1);
    const two = score(WORKED.twoTai, [season('summer')], 'east', WORKED.twoTai[13]);
    expect(two.cappedTai).toBe(2);
    const four = score(WORKED.fourTai, [flower('orchid')], 'east', WORKED.fourTai[13]);
    expect(four.cappedTai).toBe(4);
    expect(four.elements.map(e => e.id)).toContain('full_flush');
    const ping = score(WORKED.pingHu, [], 'east', tileToIndex(suit('dot', 4)));
    expect(ping.elements.map(e => e.id)).toContain('ping_hu');
    expect(ping.cappedTai).toBe(4);
  });
});
