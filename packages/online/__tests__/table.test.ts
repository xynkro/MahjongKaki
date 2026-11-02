import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from '@mahjongkaki/engine';
import { type ClaimAction, type GameAction, getAvailableActions } from '@mahjongkaki/game';
import {
  type Table, type TableResult, CLAIM_MS, act, awaited, endMatch, join, leave, newTable, ready, seatOf, setBack,
  startMatch, tick,
} from '../src/table';
import { HIDDEN_TILE, redactGame, viewFor } from '../src/view';

function room(...names: string[]): Table {
  let t = newTable('u0', names[0] ?? 'Host', DEFAULT_RULES);
  names.slice(1).forEach((n, i) => { t = join(t, `u${i + 1}`, n)!.table; });
  return t;
}

// A human who always takes the first legal thing except a win, which they always take.
function pickFor(t: Table, seat: number): GameAction {
  const acts = getAvailableActions(t.game!, seat);
  return acts.find(a => a.type === 'claim' && a.claimType === 'win')
    ?? acts.find(a => a.type === 'skip_claim')
    ?? acts.find(a => a.type === 'discard')!;
}

function playHand(start: TableResult): TableResult {
  let r = start;
  let now = 1_000;
  for (let i = 0; i < 2000 && r.table.stage === 'playing'; i++) {
    const seat = awaited(r.table)[0];
    expect(seat).toBeDefined();
    r = act(r.table, r.table.players[seat].uid!, pickFor(r.table, seat), ++now)!;
    expect(r).not.toBeNull();
  }
  return r;
}

describe('seating', () => {
  it('fills seats in order, keeps a returning player in theirs, and refuses a fifth', () => {
    let t = room('A', 'B');
    expect(seatOf(t, 'u1')).toBe(1);
    expect(join(t, 'u1', 'B2')!.seat).toBe(1);
    t = join(t, 'u2', 'C')!.table;
    t = join(t, 'u3', 'D')!.table;
    expect(join(t, 'u4', 'E')).toBeNull();
  });

  it('turns away a newcomer after the deal but lets a seated player back', () => {
    const { table } = startMatch(room('A', 'B'), 0);
    expect(join(table, 'u9', 'Late')).toBeNull();
    expect(join(table, 'u1', 'B')!.seat).toBe(1);
  });
});

describe('a full match', () => {
  it('plays whole hands with four humans and totals always net to zero', () => {
    let r = startMatch(room('A', 'B', 'C', 'D'), 0);
    for (let hand = 0; hand < 25; hand++) {
      r = playHand(r);
      expect(r.table.stage).toBe('result');
      const sum = r.table.progress.totals.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum)).toBeLessThan(1e-9);
      expect(Number.isInteger(r.table.progress.totals[0] * 2)).toBe(true); // points, no cents
      for (const u of ['u0', 'u1', 'u2', 'u3']) r = ready(r.table, u, 5_000) ?? r;
      expect(r.table.stage).toBe('playing');
    }
  });

  it('runs AI seats by itself and stops only for the human', () => {
    const r = startMatch(room('A'), 0);
    expect(awaited(r.table)).toEqual([0]); // seat 0 deals first
    const after = act(r.table, 'u0', pickFor(r.table, 0), 1)!;
    expect(after.frames.length).toBeGreaterThan(1); // own discard + the AI turns that followed
    if (after.table.stage === 'playing') expect(awaited(after.table)).toEqual([0]);
  });
});

describe('legality', () => {
  it('ignores a move from the wrong seat, an illegal tile, and a stranger', () => {
    const { table } = startMatch(room('A', 'B'), 0);
    const tile = table.game!.hands[0][0];
    expect(act(table, 'u1', { type: 'discard', tile }, 1)).toBeNull();
    expect(act(table, 'nobody', { type: 'discard', tile }, 1)).toBeNull();
    const notHeld = [...Array(34).keys()].find(t => !table.game!.hands[0].includes(t))!;
    expect(act(table, 'u0', { type: 'discard', tile: notHeld }, 1)).toBeNull();
    expect(act(table, 'u0', { type: 'claim', claimType: 'win', player: 0, tilesFromHand: [] }, 1)).toBeNull();
  });

  it('accepts an action whatever order its fields arrive in', () => {
    const { table } = startMatch(room('A'), 0);
    const tile = table.game!.hands[0][0];
    expect(act(table, 'u0', { tile, type: 'discard' } as GameAction, 1)).not.toBeNull();
  });
});

describe('claim window', () => {
  // Build a claim where seats 1 and 3 can both act on seat 0's discard.
  function claimTable(): Table {
    const { table } = startMatch(room('A', 'B', 'C', 'D'), 0);
    const pung: ClaimAction = { type: 'claim', claimType: 'pung', player: 1, tilesFromHand: [5, 5] };
    const chow: ClaimAction = { type: 'claim', claimType: 'chow', player: 3, tilesFromHand: [3, 4] };
    const c = (a: ClaimAction, priority: number) => ({ player: a.player, claimType: a.claimType, tile: 5, tilesFromHand: a.tilesFromHand, priority });
    const game = {
      ...table.game!,
      phase: 'claim' as const,
      currentPlayer: 0,
      lastDiscard: { tile: 5, player: 0 },
      discards: [[5], [], [], []],
      discardLog: [{ tile: 5, player: 0 }],
      hands: [[], [5, 5, 9, 9], [], [3, 4, 9, 9]],
      pendingClaims: [c(pung, 1), c(chow, 2)],
    };
    return { ...table, game, votes: {}, deadline: 100_000 };
  }

  it('waits for every human with a claim, then gives pung priority over chow', () => {
    const t = claimTable();
    expect(awaited(t)).toEqual([1, 3]);
    const r1 = act(t, 'u3', { type: 'claim', claimType: 'chow', player: 3, tilesFromHand: [3, 4] }, 10)!;
    expect(r1.frames).toEqual([]);
    expect(awaited(r1.table)).toEqual([1]);
    const r2 = act(r1.table, 'u1', { type: 'claim', claimType: 'pung', player: 1, tilesFromHand: [5, 5] }, 11)!;
    expect(r2.table.game!.melds[1]).toHaveLength(1);
    expect(r2.table.game!.melds[3]).toHaveLength(0);
    expect(r2.table.game!.currentPlayer).toBe(1);
  });

  it("does not let a seat vote twice, and doesn't reveal another's claim", () => {
    const t = claimTable();
    const r1 = act(t, 'u3', { type: 'skip_claim' }, 10)!;
    expect(act(r1.table, 'u3', { type: 'skip_claim' }, 11)).toBeNull();
    const seen = viewFor(r1.table, [], 3, 11);
    expect(seen.frames[0].game.pendingClaims).toEqual([]);
    expect(seen.frames[0].actions).toEqual([]);
    expect(redactGame(t.game!, 1).pendingClaims.every(c => c.player === 1)).toBe(true);
  });

  it('passes for a seat that times out and marks them away', () => {
    const t = claimTable();
    expect(tick(t, 99_999)).toBeNull();
    const r = tick(t, 100_000)!;
    expect(r.table.players[1].away).toBe(true);
    expect(r.table.players[3].away).toBe(true);
    // They no longer hold anything up, wherever the AI's decisions took the game.
    expect(awaited(r.table)).not.toContain(1);
    expect(awaited(r.table)).not.toContain(3);
  });

  it('gives a full claim clock when a human is waiting on one', () => {
    const t = claimTable();
    const r = act(t, 'u3', { type: 'skip_claim' }, 1_000)!;
    expect(r.table.deadline).toBe(1_000 + CLAIM_MS);
  });
});

describe('dropping out', () => {
  it('lets the AI cover a timed-out seat until they come back', () => {
    const { table } = startMatch(room('A', 'B'), 0);
    const r = tick(table, table.deadline!)!;
    expect(r.table.players[0].away).toBe(true);
    const back = setBack(r.table, 'u0')!;
    expect(back.players[0].away).toBe(false);
    expect(setBack(back, 'u0')).toBeNull();
  });

  it('finishes the hand by AI when everyone has gone quiet', () => {
    const { table } = startMatch(room('A', 'B'), 0);
    let r = tick(table, table.deadline!)!;
    for (let i = 0; i < 50 && r.table.stage === 'playing'; i++) r = tick(r.table, r.table.deadline!)!;
    expect(r.table.stage).toBe('result');
  });

  it('gives a leaver’s seat to the AI, hands over host, and closes an empty room', () => {
    const { table } = startMatch(room('A', 'B'), 0);
    const r = leave(table, 'u0', 1)!;
    expect(r.table.players[0].uid).toBeNull();
    expect(r.table.hostUid).toBe('u1');
    const gone = leave(r.table, 'u1', 2)!;
    expect(gone.table.stage).toBe('over');
  });

  it('moves on from the result screen once the remaining humans are ready', () => {
    let r = startMatch(room('A', 'B'), 0);
    r = playHand(r);
    r = ready(r.table, 'u0', 1)!;
    expect(r.table.stage).toBe('result');
    r = leave(r.table, 'u1', 2)!;
    expect(r.table.stage).toBe('playing');
  });

  it('deals the next hand on the deadline if someone never taps', () => {
    const r = playHand(startMatch(room('A', 'B'), 0));
    const next = tick(r.table, r.table.deadline!)!;
    expect(next.table.stage).toBe('playing');
  });
});

describe('host controls', () => {
  it('only the host can end the match', () => {
    const { table } = startMatch(room('A', 'B'), 0);
    expect(endMatch(table, 'u1')).toBeNull();
    expect(endMatch(table, 'u0')!.stage).toBe('over');
  });
});

describe('hidden information', () => {
  it('never sends a phone a tile it should not see, at any frame of a real match', () => {
    let r = startMatch(room('A', 'B', 'C', 'D'), 0);
    let checked = 0;
    for (let i = 0; i < 4000 && checked < 400; i++) {
      for (let seat = 0; seat < 4; seat++) {
        const view = viewFor(r.table, r.frames, seat, 1);
        const json = JSON.stringify(view);
        expect(json).not.toContain('"wall"');
        expect(json).not.toContain('deadWall');
        for (const f of view.frames) {
          const revealed = f.game.phase === 'finished' ? f.game.winner : null;
          for (let s = 0; s < 4; s++) {
            if (s === seat || s === revealed) continue;
            expect(f.game.hands[s].every(t => t === HIDDEN_TILE)).toBe(true);
          }
          if (f.game.lastDraw && f.game.lastDraw.player !== seat) expect(f.game.lastDraw.tile).toBe(HIDDEN_TILE);
          expect(f.game.pendingClaims.every(c => c.player === seat)).toBe(true);
          checked++;
        }
      }
      if (r.table.stage === 'result') {
        for (const u of ['u0', 'u1', 'u2', 'u3']) r = ready(r.table, u, 2) ?? r;
        continue;
      }
      const seat = awaited(r.table)[0];
      r = act(r.table, r.table.players[seat].uid!, pickFor(r.table, seat), 2)!;
    }
    expect(checked).toBeGreaterThanOrEqual(400);
  });
});
