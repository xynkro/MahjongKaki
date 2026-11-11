// The Play coach: on your turn, the throw a strong player would make and one plain sentence on why.
// It reuses the AI's own discard ranking, so the coach and the opponents agree on what "good" means.
import { indexToTile, type Meld } from '@mahjongkaki/engine';
import { evaluateDiscards, EXPERT } from '@mahjongkaki/ai';
import { shantenWithMelds } from '@mahjongkaki/game';
import { readyDistance, winningTiles } from './drill-copy';

export interface CoachTip { tile: number; text: string }

const SUIT_NAME = { bamboo: 'bamboo', character: 'characters', dot: 'dots' } as const;

export function tileName(index: number): string {
  const t = indexToTile(index);
  if (t.kind === 'suit') return `${t.value} of ${SUIT_NAME[t.suit]}`;
  if (t.kind === 'wind') return `${t.wind[0].toUpperCase()}${t.wind.slice(1)} wind`;
  return `${t.dragon} dragon`;
}

/** True when nothing else in the hand pairs with or sits next to this tile. */
function isLoner(tile: number, hand: number[]): boolean {
  const copies = hand.filter(t => t === tile).length;
  if (copies > 1) return false;
  if (tile >= 27) return true; // winds and dragons only ever pair up
  const suitStart = tile - (tile % 9);
  return ![-2, -1, 1, 2].some(d => {
    const n = tile + d;
    return n >= suitStart && n < suitStart + 9 && hand.includes(n);
  });
}

export function coachDiscard(hand: number[], melds: Meld[], discardLog: { tile: number; player: number }[]): CoachTip | null {
  if (hand.length === 0) return null;
  const ponds: number[][] = [[], [], [], []];
  for (const d of discardLog) ponds[d.player]?.push(d.tile);

  const [best] = evaluateDiscards(hand, melds, ponds, EXPERT);
  if (!best) return null;
  const name = tileName(best.tile);

  if (best.shantenAfter <= 0) {
    return { tile: best.tile, text: `Throw the ${name}. You’ll be ready, with ${winningTiles(best.acceptance)} left that win it.` };
  }
  if (isLoner(best.tile, hand)) {
    return { tile: best.tile, text: `Throw the ${name}. Nothing in your hand pairs with it or sits next to it.` };
  }
  return {
    tile: best.tile,
    text: `Throw the ${name}. You stay ${readyDistance(best.shantenAfter)}, and the most tiles can still help you (${best.acceptance} left).`,
  };
}

/**
 * When someone throws a tile you could take: which claim (if any) a strong player would make, and why.
 * Compares how far the hand is from ready now with the best it could be after claiming and throwing.
 */
export function coachClaim(
  hand: number[],
  melds: Meld[],
  claims: { claimType: string; tile: number; tilesFromHand: number[] }[],
): { pick: number | null; text: string } | null {
  if (claims.length === 0) return null;
  const win = claims.findIndex(c => c.claimType === 'win');
  if (win >= 0) return { pick: win, text: 'Take it. This tile finishes your hand.' };

  const kong = claims.findIndex(c => c.claimType === 'kong');
  if (kong >= 0) return { pick: kong, text: 'Take the kong. It costs nothing, and you draw an extra tile.' };

  const now = shantenWithMelds(hand, melds.length);
  let best: { i: number; after: number } | null = null;
  claims.forEach((c, i) => {
    const rest = [...hand];
    for (const t of c.tilesFromHand) rest.splice(rest.indexOf(t), 1);
    // After claiming you must throw one tile; take the throw that leaves you closest to ready.
    let after = 8;
    for (const t of new Set(rest)) {
      const left = [...rest];
      left.splice(left.indexOf(t), 1);
      after = Math.min(after, shantenWithMelds(left, melds.length + 1));
    }
    if (!best || after < best.after) best = { i, after };
  });

  const b = best as { i: number; after: number } | null;
  const tile = tileName(claims[0].tile);
  if (b && b.after < now) {
    const kind = claims[b.i].claimType;
    return {
      pick: b.i,
      text: `Take the ${kind}. With the ${tile} you’d be ${readyDistance(b.after)}, closer than now.`,
    };
  }
  return {
    pick: null,
    text: `Skip. Taking the ${tile} wouldn’t bring you any closer, and it shows the table what you’re collecting.`,
  };
}
