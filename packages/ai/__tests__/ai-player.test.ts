import { describe, it, expect } from 'vitest';
import { createGame, applyAction, type GameState } from '@mahjongkaki/game';
import { aiDecide, CAUTIOUS, BALANCED, STRATEGIC, EXPERT, type AiProfile } from '../src/index.js';

function simulateGame(profile: AiProfile, maxTurns = 1000): GameState {
  let state = createGame(0, 0);

  for (let turn = 0; turn < maxTurns; turn++) {
    if (state.phase === 'finished') break;

    if (state.phase === 'draw') {
      state = applyAction(state, { type: 'draw' });
      continue;
    }

    if (state.phase === 'discard') {
      const action = aiDecide(state, state.currentPlayer, profile);
      state = applyAction(state, action);
      continue;
    }

    if (state.phase === 'claim') {
      let claimed = false;
      for (const claim of state.pendingClaims) {
        const action = aiDecide(state, claim.player, profile);
        if (action.type === 'claim') {
          state = applyAction(state, action);
          claimed = true;
          break;
        }
      }
      if (!claimed) {
        state = applyAction(state, { type: 'skip_claim' });
      }
      continue;
    }
  }

  return state;
}

describe('aiDecide', () => {
  it('always returns a valid action', () => {
    const state = createGame(0, 0);
    const action = aiDecide(state, 0, BALANCED);
    expect(action.type).toBeDefined();
  });

  it('discards from own hand', () => {
    const state = createGame(0, 0);
    const action = aiDecide(state, 0, BALANCED);
    if (action.type === 'discard') {
      expect(state.hands[0]).toContain(action.tile);
    }
  });
});

describe('difficulty profiles', () => {
  it('easy AI completes a game without crashing', () => {
    const state = simulateGame(CAUTIOUS);
    expect(state.phase).toBe('finished');
  });

  it('medium AI completes a game without crashing', () => {
    const state = simulateGame(BALANCED);
    expect(state.phase).toBe('finished');
  });

  it('hard AI completes a game without crashing', () => {
    const state = simulateGame(STRATEGIC);
    expect(state.phase).toBe('finished');
  });

  it('expert AI completes a game without crashing', () => {
    const state = simulateGame(EXPERT);
    expect(state.phase).toBe('finished');
  });
});

describe('game simulation', () => {
  it('AI vs AI game reaches conclusion', () => {
    const profiles = [CAUTIOUS, BALANCED, STRATEGIC, EXPERT];
    let state = createGame(0, 0);

    for (let turn = 0; turn < 600; turn++) {
      if (state.phase === 'finished') break;

      const profile = profiles[state.currentPlayer];

      if (state.phase === 'draw') {
        state = applyAction(state, { type: 'draw' });
      } else if (state.phase === 'discard') {
        const action = aiDecide(state, state.currentPlayer, profile);
        state = applyAction(state, action);
      } else if (state.phase === 'claim') {
        let claimed = false;
        for (const claim of state.pendingClaims) {
          const action = aiDecide(state, claim.player, profiles[claim.player]);
          if (action.type === 'claim') {
            state = applyAction(state, action);
            claimed = true;
            break;
          }
        }
        if (!claimed) {
          state = applyAction(state, { type: 'skip_claim' });
        }
      }
    }

    expect(state.phase).toBe('finished');
  });
});
