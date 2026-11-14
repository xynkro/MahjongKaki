import { describe, it, expect } from 'vitest';
import { createGame } from '@mahjongkaki/game';
import { turnGuide } from '../src/lib/guide';

const names = (s: number) => ['You', 'South', 'West', 'North'][s];
const base = { awaiting: false, canTsumo: false, canKong: false, seatName: names };

describe('turn guide', () => {
  it('tells the dealer they throw first', () => {
    const gs = createGame(0, 0);
    expect(turnGuide({ ...gs, phase: 'discard', currentPlayer: 0, turnCount: 0 }, base)).toMatch(/dealer.*throw first/);
    const other = createGame(0, 2);
    expect(turnGuide({ ...other, phase: 'discard', currentPlayer: 2, turnCount: 0 }, base)).toMatch(/^West is the dealer/);
  });
  it('asks you to draw, never during a claim', () => {
    const gs = createGame(0, 0);
    expect(turnGuide({ ...gs, phase: 'discard', currentPlayer: 0, turnCount: 3 }, { ...base, awaiting: true })).toMatch(/draw/);
    const claim = { ...gs, phase: 'claim' as const, currentPlayer: 3, turnCount: 3, lastDiscard: { tile: 5, player: 3 }, pendingClaims: [{ player: 0, claimType: 'pung' as const, tile: 5, tilesFromHand: [5, 5], priority: 2 }] };
    const text = turnGuide(claim, base)!;
    expect(text).toMatch(/North threw the 6 of bamboo\. You can call Pung, or Skip/);
    expect(text).not.toMatch(/draw/i);
  });
  it('says when you are next', () => {
    const gs = createGame(0, 0);
    expect(turnGuide({ ...gs, phase: 'discard', currentPlayer: 3, turnCount: 5 }, base)).toMatch(/You go next/);
  });
});
