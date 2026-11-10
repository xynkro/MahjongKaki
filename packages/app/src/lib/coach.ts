// The Play coach: on your turn, the throw a strong player would make and one plain sentence on why.
// It reuses the AI's own discard ranking, so the coach and the opponents agree on what "good" means.
import { indexToTile, type Meld } from '@mahjongkaki/engine';
import { evaluateDiscards, EXPERT } from '@mahjongkaki/ai';
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
