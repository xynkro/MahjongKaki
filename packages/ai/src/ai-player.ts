import type { GameState, GameAction } from '@mahjongkaki/game';
import { canDeclareTsumo } from '@mahjongkaki/game';
import type { AiProfile } from './archetypes.js';
import { pickDiscard } from './discard.js';
import { shouldClaim } from './claim-eval.js';

export function aiDecide(state: GameState, seat: number, profile: AiProfile): GameAction {
  const hand = state.hands[seat];
  const melds = state.melds[seat];

  if (state.phase === 'discard' && state.currentPlayer === seat) {
    if (canDeclareTsumo(state, seat)) {
      return { type: 'claim', claimType: 'win', player: seat, tilesFromHand: [] };
    }

    // Check concealed kong
    const counts = new Map<number, number>();
    for (const t of hand) counts.set(t, (counts.get(t) ?? 0) + 1);
    for (const [tile, count] of counts) {
      if (count >= 4 && Math.random() < profile.claimRate) {
        return { type: 'declare_kong', tile };
      }
    }

    const tile = pickDiscard(hand, melds, state.discards, profile);
    return { type: 'discard', tile };
  }

  if (state.phase === 'claim') {
    const playerClaims = state.pendingClaims.filter(c => c.player === seat);

    for (const claim of playerClaims) {
      if (shouldClaim(claim, hand, melds, profile)) {
        return {
          type: 'claim',
          claimType: claim.claimType,
          player: seat,
          tilesFromHand: claim.tilesFromHand,
        };
      }
    }

    return { type: 'skip_claim' };
  }

  return { type: 'draw' };
}
