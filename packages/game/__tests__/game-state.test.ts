import { describe, it, expect } from 'vitest';
import { createGame, applyAction, getAvailableActions, type GameState } from '../src/game-state.js';

describe('createGame', () => {
  it('deals correct tile counts', () => {
    const state = createGame(0, 0);
    expect(state.hands[0]).toHaveLength(14);
    expect(state.hands[1]).toHaveLength(13);
    expect(state.hands[2]).toHaveLength(13);
    expect(state.hands[3]).toHaveLength(13);
  });

  it('starts in discard phase for dealer', () => {
    const state = createGame(0, 0);
    expect(state.phase).toBe('discard');
    expect(state.currentPlayer).toBe(0);
  });

  it('dealer seat is respected', () => {
    const state = createGame(0, 2);
    expect(state.dealerSeat).toBe(2);
    expect(state.currentPlayer).toBe(2);
    expect(state.hands[2]).toHaveLength(14);
    expect(state.hands[0]).toHaveLength(13);
  });
});

describe('game loop', () => {
  it('full turn cycle: discard → draw → discard', () => {
    let state = createGame(0, 0);

    // Dealer discards
    const dealerHand = state.hands[0];
    const discardTile = dealerHand[0];
    state = applyAction(state, { type: 'discard', tile: discardTile });

    // Either claim phase or next player draws
    if (state.phase === 'claim') {
      state = applyAction(state, { type: 'skip_claim' });
    }

    expect(state.phase).toBe('draw');
    expect(state.currentPlayer).toBe(1);

    // Player 1 draws
    state = applyAction(state, { type: 'draw' });
    expect(state.phase).toBe('discard');
    expect(state.currentPlayer).toBe(1);
    expect(state.hands[1]).toHaveLength(14);
  });

  it('discard removes tile from hand and adds to discard pile', () => {
    let state = createGame(0, 0);
    const tile = state.hands[0][0];
    const handBefore = state.hands[0].length;

    state = applyAction(state, { type: 'discard', tile });

    expect(state.hands[0]).toHaveLength(handBefore - 1);
    expect(state.discards[0]).toContain(tile);
  });

  it('cannot discard tile not in hand', () => {
    const state = createGame(0, 0);
    const hand = state.hands[0];
    const missingTile = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33]
      .find(t => !hand.includes(t))!;

    const result = applyAction(state, { type: 'discard', tile: missingTile });
    expect(result.hands[0]).toHaveLength(14);
  });

  it('draw from empty wall ends the game', () => {
    let state = createGame(0, 0);
    state.wall = [];
    state.phase = 'draw';

    state = applyAction(state, { type: 'draw' });
    expect(state.phase).toBe('finished');
    expect(state.winner).toBeNull();
  });

  it('getAvailableActions returns discard options for current player', () => {
    const state = createGame(0, 0);
    const actions = getAvailableActions(state, 0);

    const discardActions = actions.filter(a => a.type === 'discard');
    expect(discardActions.length).toBeGreaterThan(0);
    expect(discardActions.length).toBeLessThanOrEqual(14);
  });

  it('getAvailableActions returns nothing for non-current player', () => {
    const state = createGame(0, 0);
    const actions = getAvailableActions(state, 1);
    expect(actions).toHaveLength(0);
  });

  it('multiple turns without crash', () => {
    let state = createGame(0, 0);

    for (let turn = 0; turn < 20; turn++) {
      if (state.phase === 'finished') break;

      if (state.phase === 'discard') {
        const tile = state.hands[state.currentPlayer][0];
        state = applyAction(state, { type: 'discard', tile });
      } else if (state.phase === 'draw') {
        state = applyAction(state, { type: 'draw' });
      } else if (state.phase === 'claim') {
        state = applyAction(state, { type: 'skip_claim' });
      }
    }

    expect(state.turnCount).toBeGreaterThan(0);
  });
});
