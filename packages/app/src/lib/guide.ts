// The turn guide: one plain sentence for every moment of a hand, saying whose turn it is and
// what the learner can do. Pure, so it is easy to test.
import { type GameState } from '@mahjongkaki/game';
import { tileName } from './coach';

export interface GuideInput {
  /** Your tile is waiting in the wall for you to tap it. */
  awaiting: boolean;
  canTsumo: boolean;
  canKong: boolean;
  seatName: (seat: number) => string;
}

const CLAIM_WORD: Record<string, string> = { win: 'Hu (win with it)', kong: 'Kong', pung: 'Pung', chow: 'Chow' };

export function turnGuide(state: GameState, o: GuideInput): string | null {
  if (state.phase === 'finished') return null;
  const hs = state.humanSeat;
  const cur = state.currentPlayer;
  const name = o.seatName(cur);

  if (state.phase === 'claim' && state.lastDiscard) {
    const who = state.lastDiscard.player === hs ? 'You' : o.seatName(state.lastDiscard.player);
    const tile = tileName(state.lastDiscard.tile);
    const mine = [...new Set(state.pendingClaims.filter(c => c.player === hs).map(c => c.claimType))];
    if (mine.length) {
      const opts = mine.map(t => CLAIM_WORD[t] ?? t).join(' or ');
      return `${who} threw the ${tile}. You can call ${opts}, or Skip to let it go.`;
    }
    return `${who} threw the ${tile}. Waiting to see if anyone takes it.`;
  }

  const dealerFirst = state.turnCount === 0 && cur === state.dealerSeat && state.phase === 'discard';
  if (cur === hs) {
    if (state.phase === 'draw' || o.awaiting) return 'Your turn. Tap the glowing stack in the wall to draw a tile.';
    if (o.canTsumo) return 'This tile wins you the hand! Tap Tsumo, or throw a tile to play on.';
    if (dealerFirst) return 'You are the dealer, so you start with 14 tiles and throw first. Drag a tile up, or tap it twice.';
    if (o.canKong) return 'You have all four of a kind. Tap Kong to show them and draw a spare, or throw a tile.';
    return 'Your turn. Throw a tile you don’t need: drag it up, or tap it twice.';
  }

  const nextIsYou = (cur + 1) % 4 === hs;
  if (dealerFirst) return `${name} is the dealer, so they start with 14 tiles and throw first.${nextIsYou ? ' You go next.' : ''}`;
  if (state.phase === 'draw') return `${name} draws a tile from the wall.`;
  return `${name} is choosing a tile to throw.${nextIsYou ? ' You go next.' : ''}`;
}
