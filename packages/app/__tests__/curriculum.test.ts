import { describe, it, expect } from 'vitest';
import { CURRICULUM } from '../src/learn/curriculum';

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
});
